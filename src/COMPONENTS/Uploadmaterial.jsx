import { useRef, useState } from "react";
import styles from "./Uploadmaterial.module.css";

export default function Uploadmaterial() {
    const fileInputRef = useRef(null);

    const [folderName, setFolderName] = useState("");
    const [currentPath, setCurrentPath] = useState("root");

    // folders by parent
    const [foldersByParent, setFoldersByParent] = useState({
        root: [],
    });

    // files by folder
    const [filesByFolder, setFilesByFolder] = useState({
        root: [],
    });

    const createFolder = () => {
        const name = folderName.trim();
        if (!name) return;

        const newPath = `${currentPath}/${name}`;

        // stop duplicate folder names in same folder
        const alreadyExists = (foldersByParent[currentPath] || []).some(
            (folder) => folder.name.toLowerCase() === name.toLowerCase()
        );

        if (alreadyExists) {
            alert("Folder already exists in this location");
            return;
        }

        setFoldersByParent((prev) => ({
            ...prev,
            [currentPath]: [...(prev[currentPath] || []), { name, path: newPath }],
            [newPath]: prev[newPath] || [],
        }));

        setFilesByFolder((prev) => ({
            ...prev,
            [newPath]: prev[newPath] || [],
        }));

        setFolderName("");
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFilesChange = (e) => {
        const selectedFiles = Array.from(e.target.files);

        if (selectedFiles.length === 0) return;

        const newFiles = selectedFiles.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type || "Unknown",
        }));

        setFilesByFolder((prev) => ({
            ...prev,
            [currentPath]: [...(prev[currentPath] || []), ...newFiles],
        }));

        e.target.value = "";
    };

    const openFolder = (path) => {
        setCurrentPath(path);
    };

    const goBack = () => {
        if (currentPath === "root") return;

        const parts = currentPath.split("/");
        parts.pop();
        const parentPath = parts.join("/") || "root";
        setCurrentPath(parentPath);
    };

    const currentFolders = foldersByParent[currentPath] || [];
    const currentFiles = filesByFolder[currentPath] || [];

    const pathParts = currentPath.split("/");

    return (
        <div className={styles.wrapper}>
            {/* top */}
            <div className={styles.topBar}>
                <div>
                    <h2 className={styles.title}>File Manager</h2>
                    <p className={styles.subTitle}>Manage folders and files easily</p>
                </div>

                <button
                    className={styles.backBtn}
                    onClick={goBack}
                    disabled={currentPath === "root"}
                >
                    Back
                </button>
            </div>

            {/* breadcrumb */}
            <div className={styles.breadcrumb}>
                {pathParts.map((part, index) => (
                    <span key={index}>
                        {part}
                        {index !== pathParts.length - 1 && " / "}
                    </span>
                ))}
            </div>

            {/* actions */}
            <div className={styles.actions}>
                <div className={styles.inputGroup}>
                    <input
                        type="text"
                        placeholder="Create new folder"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        className={styles.input}
                    />
                    <button className={styles.primaryBtn} onClick={createFolder}>
                        Create Folder
                    </button>
                </div>

                <div>
                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFilesChange}
                        className={styles.hiddenInput}
                    />
                    <button className={styles.secondaryBtn} onClick={handleUploadClick}>
                        Upload File
                    </button>
                </div>
            </div>

            {/* folders */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Folders</h3>

                {currentFolders.length === 0 ? (
                    <p className={styles.empty}>No folders here</p>
                ) : (
                    <div className={styles.grid}>
                        {currentFolders.map((folder, index) => (
                            <button
                                key={index}
                                className={styles.card}
                                onClick={() => openFolder(folder.path)}
                            >
                                <div className={styles.cardTitle}>{folder.name}</div>
                                <div className={styles.cardText}>Open folder</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* files */}
            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Files</h3>

                {currentFiles.length === 0 ? (
                    <p className={styles.empty}>No files in this folder</p>
                ) : (
                    <div className={styles.fileList}>
                        {currentFiles.map((file, index) => (
                            <div key={index} className={styles.fileItem}>
                                <div>
                                    <p className={styles.fileName}>{file.name}</p>
                                    <span className={styles.fileMeta}>
                                        {Math.ceil(file.size / 1024)} KB
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
