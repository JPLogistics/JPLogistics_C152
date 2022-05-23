Set objFso = CreateObject("Scripting.FileSystemObject")

Set Folder = objFSO.GetFolder("D:\MSFS\JPLogistics_C152\Project Files\src\Build Images\Converting - Ignore")

For Each File In Folder.Files

    sNewFile = File.Name

    sNewFile = Replace(sNewFile,".PNG.PNG",".PNG")
    sNewFile = Replace(sNewFile,".TIF.PNG",".PNG")
    if (sNewFile<>File.Name) then

        File.Move(File.ParentFolder+"\"+sNewFile)

    end if
Next