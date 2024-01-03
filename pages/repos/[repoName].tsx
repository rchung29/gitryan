import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeftToLine, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  FileText,
  Folder,
  GitCommitHorizontal,
  FolderOpen,
} from "lucide-react";
import { root } from "postcss";
import { rootCertificates } from "tls";
import { transcode } from "buffer";
import { Switch } from "@/components/ui/switch";
interface TreeData {
  files: string[];
}

interface TreeNode {
  id: string;
  name: string;
  children: TreeNode[];
}

interface PathMap {
  [key: string]: TreeNode;
}

interface FileNodeProps {
  node: TreeNode;
  onFileClick: (node: TreeNode, isFile: boolean) => void;
  openNodes: OpenNodesMap; // Add this line
}

interface OpenNodesMap {
  [key: string]: boolean;
}

interface FileTreeProps {
  data: TreeNode[];
  onFileClick: (node: TreeNode, isFile: boolean) => void;
  openNodes: OpenNodesMap;
}

interface Commit {
  author: string;
  commit: string; // Assuming this is the commit hash
  message: string;
}

interface CommitCardProps {
  commit: Commit;
}

interface CommitHistoryProps {
  commits: Commit[];
}

interface CodeDisplayProps {
  content: string;
}

const RepoDetails = () => {
  const [repoTree, setRepoTree] = useState<TreeNode[]>([]);

  const [commitHist, setCommitHist] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileContent, setFileContent] = useState("");
  const [openNodes, setOpenNodes] = useState<OpenNodesMap>({});

  const [selectedFileName, setSelectedFileName] = useState("");

  const [showFileTree, setShowFileTree] = useState(true); // true for file tree, false for commit history
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // manage open/close state


  const router = useRouter();
  const { repoName = "" } = router.query; // Default to an empty string if undefined
  const repoNameStr = Array.isArray(repoName) ? repoName[0] : repoName || "";

  useEffect(() => {
    if (!router.isReady || !repoName) return;

    setIsLoading(true);
    fetch(`https://api.rchung.dev/repo/${repoName}/tree/main/`)
      .then((response) => response.json())
      .then((data) => {
        const transformedTree = transformDataToTreeStructure(data);
        console.log(transformedTree);
        setRepoTree(transformedTree);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching repository details:", error);
        setIsLoading(false);
      });
    fetch(`https://api.rchung.dev/repo/${repoName}/history`)
      .then((response) => response.json())
      .then((data) => {
        setCommitHist(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching repository details:", error);
        setIsLoading(false);
      });
  }, [router.isReady, repoName]);

  const transformDataToTreeStructure = (data: TreeData) => {
    const { files } = data;
    const rootNode: TreeNode = { id: "root", name: repoNameStr, children: [] };

    const pathMap: PathMap = { root: rootNode };

    // Add files to the rootNode, ignoring .git and .idea files
    files.forEach((filePath) => {
      // Skip .git and .idea files
      if (filePath.startsWith(".git") || filePath.startsWith(".idea")) {
        return;
      }

      const parts = filePath.split("/");
      const fileName = parts.pop();
      let currentPath = "root";

      // Build the path and create folders if they don't exist
      parts.forEach((part) => {
        currentPath += "/" + part;
        if (!pathMap[currentPath]) {
          pathMap[currentPath] = {
            id: currentPath,
            name: part,
            children: [],
          };

          const parentPath = currentPath.slice(0, currentPath.lastIndexOf("/"));
          pathMap[parentPath].children.push(pathMap[currentPath]);
        }
      });

      // Ensure name is always a string, even if fileName is undefined
      const safeFileName = fileName || "Unnamed File";

      // Add the file to the appropriate folder
      const fileNode: TreeNode = {
        id: filePath,
        name: safeFileName,
        children: [], // Even though files don't have children, provide an empty array for consistency
      };

      pathMap[currentPath].children.push(fileNode);
    });

    return rootNode.children;
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-zinc-50 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 bg-zinc-50 border-zinc-600"></div>
      </div>
    );
  }
  const FileNode: React.FC<FileNodeProps> = ({ node, onFileClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const hasChildren = node.children && node.children.length > 0;
    const isFile = !hasChildren; // Assuming nodes without children are files

    // Define the color based on hover state
    const textColorClass = isHovered ? "text-zinc-600" : "text-zinc-400";

    const handleClick = () => onFileClick(node, isFile);

    const renderChildren = () => {
      return node.children.map((child) => (
        <FileNode
          key={child.id}
          node={child}
          onFileClick={onFileClick}
          openNodes={openNodes}
        />
      ));
    };

    return (
      <div>
        <div
          onClick={handleClick}
          className={`cursor-pointer flex items-center ${textColorClass}`}
        >
          {hasChildren && (
            <span onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? (
                <FolderOpen height={15} width={15} />
              ) : (
                <Folder height={15} width={15} />
              )}
            </span>
          )}
          {isFile && <FileText height={15} width={15} className="mr-0" />}
          <span className="ml-2">{node.name}</span>
        </div>
        {openNodes[node.id] && node.children && (
          <div className="pl-4">
            {node.children.map((child) => (
              <FileNode
                key={child.id}
                node={child}
                onFileClick={onFileClick}
                openNodes={openNodes}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const FileTree: React.FC<FileTreeProps> = ({
    data,
    onFileClick,
    openNodes,
  }) => {
    return (
      <div>
        {data.map((node) => (
          <FileNode
            key={node.id}
            node={node}
            onFileClick={onFileClick}
            openNodes={openNodes}
          />
        ))}
      </div>
    );
  };

  const CommitCard: React.FC<CommitCardProps> = ({ commit }) => {
    return (
      <div className="border rounded p-2 mb-2">
        <p className="text-zinc-600">{commit.author}</p>
        <p className="text-zinc-400 pb-2">{commit.message}</p>
        <div className="flex flex-row space-x-1">
          <GitCommitHorizontal className="stroke-zinc-400"></GitCommitHorizontal>
          <p className="text-zinc-400 font-bold">{commit.commit.slice(0, 5)}</p>
        </div>
      </div>
    );
  };

  const CommitHistory: React.FC<CommitHistoryProps> = ({ commits }) => {
    const reversedCommits = [...commits].reverse();

    return (
      <div>
        {reversedCommits.map((commit) => (
          <CommitCard key={commit.commit} commit={commit} />
        ))}
      </div>
    );
  };

  const fetchFileContent = async (filePath: String) => {
    const apiUrl = `https://api.rchung.dev/repo/${repoName}/file/main/${filePath}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      return data.content; // Assuming the API returns an object with a 'content' field
    } catch (error) {
      console.error("Error fetching file content:", error);
      return ""; // Return an empty string in case of an error
    }
  };

  const handleFileClick = async (node: TreeNode, isFile: boolean) => {
    if (isFile) {
      const content = await fetchFileContent(node.id);
      setFileContent(content);
      setSelectedFileName(node.name);
    } else {
      setOpenNodes((prevOpenNodes) => ({
        ...prevOpenNodes,
        [node.id]: !prevOpenNodes[node.id],
      }));
    }
  };

  const CodeDisplay: React.FC<CodeDisplayProps> = ({ content }) => {
    return (
      <div className="bg-zinc-50 overflow-y-auto">
        <div style={{ whiteSpace: "pre-wrap" }} className="text-zinc-400">
          {content.split("\n").map((line, index) => (
            <span key={index}>
              {line}
              <br />
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen">
      {/* Collapsed Sidebar (Icon Button) */}
      <div className={`sm:hidden ${isSidebarOpen ? 'hidden' : 'flex'} flex-col items-center w-12 h-screen bg-zinc-50 border-r border-zinc-300 p-6`}>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="bg-blue-500 text-white p-2 rounded"
        >
          <PanelLeftOpen height={20} width={20} />
        </button>
      </div>

      {/* Expanded Sidebar */}
      <div className={`flex flex-col ${isSidebarOpen ? 'w-full' : 'hidden'} h-screen bg-zinc-50 border-r border-zinc-300 p-6 transition-all duration-300 overflow-y-auto sm:w-1/4 sm:block`}>
        <div className="flex flex-row justify-between items-center">
        <Link
          href="/"
          className="text-zinc-500 text-md flex items-center hover:text-zinc-700 transition ease-in-out mb-1"
        >
          <ArrowLeftToLine height={15} width={15} className="mr-1" />
          Go Back
        </Link>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="bg-red-500 text-white p-2 rounded mb-4 w-9 md:hidden"
        >
          <PanelLeftClose height={20} width={20} />
        </button>
        </div>
        <h1 className="text-3xl font-semibold mb-2 text-zinc-600 mb-4">
          {repoName}
        </h1>
        <div className="flex flex-row space-x-2">
        <Switch
          checked={showFileTree}
          onCheckedChange={() => setShowFileTree(!showFileTree)}
          className="mb-4"
        />
        <p className="text-zinc-500 font-bold">Show Commit History</p>
        </div>
        {showFileTree ? (
          <FileTree
            data={repoTree}
            onFileClick={handleFileClick}
            openNodes={openNodes}
          />
        ) : (
          <CommitHistory commits={commitHist} />
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-zinc-50">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-zinc-600">
            {selectedFileName}
          </h2>
        </div>
        <CodeDisplay content={fileContent} />
      </div>
    </div>
  );
};

export default RepoDetails;
