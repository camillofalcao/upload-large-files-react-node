import React, { useState } from "react";


const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setProgress(0);
    setStatus(`Arquivo selecionado: ${file.name}`);
  };

  const handleFileUpload = () => {
    if (!selectedFile) {
      alert("Selecione um arquivo para envio.");
      return;
    }

    const chunkSize = 5 * 1024 * 1024; // 5MB
    const totalChunks = Math.ceil(selectedFile.size / chunkSize);
    const chunkProgress = 100 / totalChunks;
    let chunkNumber = 0;
    let start = 0;
    let end = 0;

    const uploadNextChunk = async () => {
      if (end <= selectedFile.size) {
        end = start + chunkSize;
        const chunk = selectedFile.slice(start, end);
        const formData = new FormData();
        formData.append("file", chunk);
        formData.append("chunkNumber", chunkNumber);
        formData.append("totalChunks", totalChunks);
        formData.append("originalname", selectedFile.name);

        fetch("http://localhost:8000/upload", {
          method: "POST",
          body: formData,
        })
          .then((response) => {
            if (!response.ok) {
              setStatus("Erro ao enviar parte do arquivo");
              throw new Error("Erro ao enviar parte do arquivo");
            }
            return response.json()
          })
          .then((data) => {
            console.log({ data });
            const temp = `${
              chunkNumber + 1
            }/${totalChunks} partes enviadas`;
            setStatus(temp);
            setProgress(Number((chunkNumber + 1) * chunkProgress));
            console.log(temp);
            chunkNumber++;
            start = end;
            
            uploadNextChunk();
          })
          .catch((error) => {
            console.error("Erro ao enviar parte do arquivo:", error);
          });
      } else {
        setProgress(100);
        setSelectedFile(null);
        setStatus("Envio de arquivo concluído com sucesso!");
      }
    };

    uploadNextChunk();
  };

  return (
    <div>
      <h2>Upload de arquivo</h2>
      <h3>{status}</h3>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Enviar</button>
      {progress && `${progress.toFixed(1)}%`}
    </div>
  );
};

export default FileUpload;
