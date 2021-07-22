Set objFso = CreateObject("Scripting.FileSystemObject")

Set Folder = objFSO.GetFolder("C:\Users\joshu\Documents\GitHub\JPLogistics_C152\Project Files\src\Converted-IGNORE")

For Each File In Folder.Files

    sNewFile = File.Name

    sNewFile = Replace(sNewFile,".PNG.PNG",".PNG")
    sNewFile = Replace(sNewFile,".TIF.PNG",".PNG")
    if (sNewFile<>File.Name) then

        File.Move(File.ParentFolder+"\"+sNewFile)

    end if
Next