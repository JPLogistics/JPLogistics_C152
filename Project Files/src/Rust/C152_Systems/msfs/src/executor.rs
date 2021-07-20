use futures::{channel::mpsc, Future};
use std::pin::Pin;
use std::task::Poll;

pub(crate) type ExecutorFuture =
    Pin<Box<dyn Future<Output = Result<(), Box<dyn std::error::Error>>> + 'static>>;

pub struct Executor<I, T> {
    pub handle: fn(I) -> ExecutorFuture,
    pub future: Option<ExecutorFuture>,
    pub tx: Option<mpsc::Sender<T>>,
}

impl<I, T> Executor<I, T> {
    pub(crate) fn start(
        &mut self,
        get_input: Box<dyn Fn(mpsc::Receiver<T>) -> I>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if self.future.is_some() {
            eprintln!("MSFS-RS: RESTARTING EXECUTOR");
            self.future.take();
            self.tx.take();
        }

        let (tx, rx) = mpsc::channel(1);
        self.tx = Some(tx);
        let input = get_input(rx);

        let mut f = (self.handle)(input);

        let mut context = std::task::Context::from_waker(futures::task::noop_waker_ref());
        match match f.as_mut().poll(&mut context) {
            Poll::Pending => Ok(()),
            Poll::Ready(v) => v,
        } {
            Ok(()) => {
                self.future = Some(f);
                Ok(())
            }
            e => e,
        }
    }

    pub(crate) fn send(&mut self, data: Option<T>) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(data) = data {
            self.tx.as_mut().unwrap().try_send(data).unwrap();
        } else {
            self.tx.take();
        }
        let mut context = std::task::Context::from_waker(futures::task::noop_waker_ref());
        match self.future.as_mut().unwrap().as_mut().poll(&mut context) {
            Poll::Pending => Ok(()),
            Poll::Ready(v) => v,
        }
    }
}
