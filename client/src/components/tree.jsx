const FileTreeNode = ({ fileName, nodes, onSelect, path }) => {
    // console.log({ nodes });
    const isDirectory = !!nodes;
    return (
        <div onClick={(e) =>{
            e.stopPropagation();
            if(isDirectory) return;
            onSelect(path);
        }} style={{marginLeft: "10px"}}>
            <p className={isDirectory ? "" : "file-node"}>{fileName}</p>
            {nodes && fileName !== "node_modules" && (
                <ul>
                {Object.keys(nodes).map((child) => (
                     <li key={child}>
                     <FileTreeNode 
                     onSelect={onSelect}
                     path={path + '/' + child} 
                     fileName={child} 
                     nodes={nodes[child]} />
                    </li>
                ))}
                </ul>
            )}
        </div>
    );
};
// FileTree component
const FileTree = ({ tree, onSelect }) => {
    return <FileTreeNode onSelect={onSelect} fileName="/" path="" nodes={tree} />;
};

export default FileTree;