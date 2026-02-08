import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Button,
  Text,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { ArrowUploadRegular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "48px 24px",
    gap: "24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
  },
  subtitle: {
    fontSize: "14px",
    color: tokens.colorNeutralForeground3,
    textAlign: "center",
    maxWidth: "480px",
  },
  dropZone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    width: "100%",
    maxWidth: "480px",
    padding: "48px 24px",
    borderRadius: "8px",
    border: `2px dashed ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: "pointer",
    transition: "border-color 0.2s, background-color 0.2s",
    ":hover": {
      borderColor: tokens.colorBrandStroke1,
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  dropZoneActive: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    width: "100%",
    maxWidth: "480px",
    padding: "48px 24px",
    borderRadius: "8px",
    border: `2px dashed ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2,
    cursor: "pointer",
  },
  icon: {
    fontSize: "48px",
    color: tokens.colorBrandForeground1,
  },
  dropText: {
    fontSize: "16px",
    fontWeight: 500,
  },
  dropHint: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
  },
  error: {
    maxWidth: "480px",
    width: "100%",
  },
  info: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
    textAlign: "center",
    maxWidth: "480px",
  },
});

interface FileUploadProps {
  onFileLoaded: (workbook: XLSX.WorkBook) => void;
}

const EXPECTED_SHEETS = ["People", "Relationships", "Events"];

export default function FileUpload({ onFileLoaded }: FileUploadProps) {
  const styles = useStyles();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.endsWith(".xlsx")) {
        setError("Please upload an .xlsx file (Excel workbook).");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });

          const foundSheets = EXPECTED_SHEETS.filter((name) =>
            workbook.SheetNames.includes(name)
          );

          if (foundSheets.length === 0) {
            setError(
              `No expected sheets found. The workbook should contain at least one of: ${EXPECTED_SHEETS.join(", ")}. ` +
              `Found sheets: ${workbook.SheetNames.join(", ")}`
            );
            return;
          }

          onFileLoaded(workbook);
        } catch {
          setError("Failed to parse the file. Please ensure it is a valid .xlsx workbook.");
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file. Please try again.");
      };
      reader.readAsArrayBuffer(file);
    },
    [onFileLoaded]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className={styles.root}>
      <Text className={styles.title}>Relationship Navigator</Text>
      <Text className={styles.subtitle}>
        Upload an Excel workbook (.xlsx) with People, Relationships, and Events sheets
        to visualize and analyze your relationship network.
      </Text>

      <div
        className={isDragging ? styles.dropZoneActive : styles.dropZone}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <ArrowUploadRegular className={styles.icon} />
        <Text className={styles.dropText}>
          {isDragging ? "Drop your file here" : "Drag & drop your .xlsx file here"}
        </Text>
        <Text className={styles.dropHint}>or click to browse</Text>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <div className={styles.error}>
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        </div>
      )}

      <Text className={styles.info}>
        All data stays in your browser. Nothing is uploaded to any server.
      </Text>
    </div>
  );
}
