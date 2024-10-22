import { useCallback, useEffect, useState } from 'react';
import './App.css'
import Terminal from './components/terminal'
import FileTree from './components/tree';
import socket from './socket';
import AceEditor from "react-ace";

// import ace css
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";


function App() {
  const [fileTree, setFileTree] = useState({});
  const [selectedFile, setSelectedFile] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [editorContent, setEditorContent] = useState('');


  const isSaved = selectedFileContent === editorContent;
  // Save file content to backend when editor content changes
  useEffect(() => {
    if(editorContent && !isSaved){
      const timer = setTimeout(() => {
        socket.emit('file:write', { path: selectedFile, content: editorContent });
      }, 5*1000 );
      return () => {
        clearTimeout(timer);
      };
    }
  }, [editorContent, selectedFile, isSaved]);
//clear editor content when file is changed
  useEffect(() => {
    setEditorContent('');
  },[selectedFile]);
//set editor content when file content is changed
  useEffect(() => {
   setEditorContent(selectedFileContent);
  }, [selectedFileContent]);

  //Fetch file tree on mount
  const getFileTree = async () => {
    try{ const response = await fetch("http://localhost:3000/files");
    const result = await response.json();
    console.log("File tree fetched: ", result.tree);
    setFileTree(result.tree);
    } catch (error) {
      console.error("Failed to fetch file tree: ", error);
    }
  };

  // Fetch file content when selectedFile changes
  const getFileContent = useCallback(async () => {
    if (!selectedFile) return;
    const response = await fetch(`http://localhost:3000/files/content?path=${selectedFile}`);
    const result = await response.json();
    setSelectedFileContent(result.content);
  }, [selectedFile]);
  
  //written by me 
  useEffect(() => {
    if(selectedFile) getFileContent();
   }, [getFileContent, selectedFile]);

  // Refresh file tree when file is added/removed externally
  useEffect(() => {
    socket.on('fileRefresh', getFileTree);
    return () => {
      socket.off('fileRefresh');
    };
  }, [ getFileTree ]);

  // Fetch file tree on first load
  useEffect(() => {
    getFileTree();  
  }, []);


  // Update editor content when selected file or file content changes
  useEffect(() => {
    if (selectedFileContent !== editorContent) {
      setEditorContent(selectedFileContent);
    }
  }, [selectedFileContent]);


  // Listen for external file updates and sync them
  useEffect(() => {
    socket.on('file:update', ({ path, content }) => {
      if (path === selectedFile) {
        setSelectedFileContent(content);
      }
    });

    return () => {
      socket.off('file:update');
    };
  }, [selectedFile]);


  
// main return
  return ( 
  <div className='playground-container'>
    <div className='editor-container'>
      <div className='files'>
        <FileTree
          onSelect={(path) =>{
            setSelectedFileContent('');
            setSelectedFile(path);
          }} 
          tree={fileTree} 
          />  
      </div>
      <div className='editor'>
        {selectedFile && ( 
          <p>
            {selectedFile.replaceAll("/"," > ")}{" "}
            {isSaved ? "✅" : "💾"}
            </p>
          )}
        <AceEditor
        //  width='100%'
        //  mode={getFilemode({selectedFile})}
         value={editorContent} 
         onChange={(e) => setEditorContent(e)} 
         />
      </div>
    </div>
    <div className='terminal-container'>
      <Terminal />
    </div>
  </div>
  );
}

export default App;