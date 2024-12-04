import { useEffect, useState, useRef, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import styles from "@/components/GenerateBox.module.css";
import Btn from "./Btn";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCheck,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

const GenerateBox = ({ projectPath }) => {
  const [indexFile, setIndexFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [clickedElement, setClickedElement] = useState(null);
  const [indexFileState, setIndexFileState] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const contentRef = useRef(null);

  const router = useRouter();

  const fetchDirectoryContents = async (dirPath) => {
    const res = await fetch(
      `http://localhost:3000/user-templates/directory?dirPath=${dirPath}`
    );
    const json = await res.json();
    return json;
  };

  const processDirectory = async (directory) => {
    // directory.children이 배열일 때만 처리
    if (directory.isDirectory && Array.isArray(directory.children)) {
        for (const child of directory.children) {
            await processDirectory(child);
        }
    } else if (directory.isDirectory) {
        // directory.children이 배열이 아니거나 없는 경우
        const children = await fetchDirectoryContents(directory.path);
        directory.children = children || [];  // 빈 배열로 기본값 설정
        for (const child of directory.children) {
            await processDirectory(child);
        }
    }
};

  const fetchFileData = async () => {
    const initialData = await fetchDirectoryContents(projectPath);

    await processDirectory({ isDirectory: true, children: initialData });

    const findIndexFile = (files) => {
      for (const file of files) {
        if (file.isDirectory && file.children) {
          const foundFile = findIndexFile(file.children);
          if (foundFile) return foundFile;
        } else if (file.name === "index.html") {
          return file;
        }
      }
      return null;
    };

    const indexHtmlFile = findIndexFile(initialData);
    setIndexFile(indexHtmlFile);
    setIndexFileState(indexHtmlFile);

    if (indexHtmlFile) {
      await fetchFileContent(indexHtmlFile.path);
    }
  };

  useEffect(() => {
    fetchFileData();
  }, [projectPath]);

  const fetchFileContent = async (filePath) => {
    const res = await fetch(`http://localhost:3000${filePath}`);
    const content = await res.text();
    setFileContent(content);
  };

  const clearHighlight = () => {
    if (contentRef.current) {
      const elements = contentRef.current.querySelectorAll(
        `.${styles.DOMhighlighted}`
      );
      elements.forEach((element) => {
        element.classList.remove(styles.DOMhighlighted);
      });
    }
  };

  const handleElementClick = useCallback(
    (event) => {
      event.stopPropagation();
      event.preventDefault();
      const targetElement = event.target;

      if (clickedElement === targetElement) {
        clearHighlight();
        setClickedElement(null);
        setShowOverlay(false);
      } else {
        clearHighlight();
        targetElement.classList.add(styles.DOMhighlighted);
        setClickedElement(targetElement);
        setShowOverlay(true);
      }
    },
    [clickedElement, clearHighlight]
  );
  useEffect(() => {
    const currentContentRef = contentRef.current;

    if (currentContentRef) {
      currentContentRef.addEventListener("click", handleElementClick);
    }

    return () => {
      if (currentContentRef) {
        currentContentRef.removeEventListener("click", handleElementClick);
      }
    };
  }, [handleElementClick]);

  useEffect(() => {
    const body = document.body;
    if (showOverlay) {
      //body.classList.add(styles.dimmed);
    } else {
      body.classList.remove(styles.dimmed);
    }

    return () => {
      body.classList.remove(styles.dimmed);
    };
  }, [showOverlay]);

  const applyDataSetbg = () => {
    if (contentRef.current) {
      const elements = contentRef.current.querySelectorAll("[data-setbg]");
      elements.forEach((element) => {
        const bg = element.getAttribute("data-setbg");
        if (bg) {
          element.style.backgroundImage = `url(${bg})`;
        }
      });
    }
  };

  useEffect(() => {
    if (fileContent) {
      applyDataSetbg();
    }
  }, [fileContent]);

  const renderFileContent = () => {
    if (!fileContent) return null;

    if (typeof window !== "undefined") {
      const parser = new DOMParser();
      const doc = parser.parseFromString(fileContent, "text/html");

      const basePath = indexFile.path.substring(
        0,
        indexFile.path.lastIndexOf("/")
      );

      const updatePaths = (element) => {
        if (element.tagName === "IMG" || element.tagName === "SCRIPT") {
          const src = element.getAttribute("src");
          if (src && !src.startsWith("http")) {
            element.setAttribute(
              "src",
              `http://localhost:3000${basePath}/${src}`
            );
          }
        } else if (element.tagName === "LINK") {
          const href = element.getAttribute("href");
          if (href && !href.startsWith("http")) {
            element.setAttribute(
              "href",
              `http://localhost:3000${basePath}/${href}`
            );
          }
        }

        const dataSetBg = element.getAttribute("data-setbg");
        if (dataSetBg && !dataSetBg.startsWith("http")) {
          const fullPath = `http://localhost:3000${basePath}/${dataSetBg}`;
          element.setAttribute(
            "style",
            `background-image: url('${fullPath}');`
          );
          element.removeAttribute("data-setbg");
        } else if (dataSetBg && dataSetBg.startsWith("http")) {
          element.setAttribute(
            "style",
            `background-image: url('${dataSetBg}');`
          );
          element.removeAttribute("data-setbg");
        }

        const style = element.getAttribute("style");
        if (style) {
          const updatedStyle = style.replace(
            /url\(["']?([^"')]+)["']?\)/g,
            (match, url) => {
              if (!url.startsWith("http")) {
                return `url(http://localhost:3000${basePath}/${url})`;
              }
              return match;
            }
          );
          element.setAttribute("style", updatedStyle);
        }

        if (element.children && element.children.length > 0) {
          for (let i = 0; i < element.children.length; i++) {
            updatePaths(element.children[i]);
          }
        }
      };

      const updateNestedPaths = (node) => {
        const imgTags = Array.from(node.querySelectorAll("img"));
        imgTags.forEach((img) => updatePaths(img));

        const nestedChildren = node.querySelectorAll("*");
        nestedChildren.forEach((child) => {
          if (child.children && child.children.length > 0) {
            updatePaths(child);
          }
        });
      };

      updateNestedPaths(doc);

      const linkTags = Array.from(
        doc.querySelectorAll('link[rel="stylesheet"]')
      );
      linkTags.forEach((tag) => {
        const href = tag.getAttribute("href");
        if (href && !href.startsWith("http")) {
          tag.setAttribute("href", `http://localhost:3000${basePath}/${href}`);
        }
      });

      const updatedHTML = doc.documentElement.outerHTML;

      return (
        <div className={styles.genBoxWrap}>
          <Head>
            {linkTags.map((tag, index) => (
              <link
                key={index}
                rel="stylesheet"
                href={tag.getAttribute("href")}
              />
            ))}
          </Head>
          <div
            ref={contentRef}
            className={styles.genBox}
            dangerouslySetInnerHTML={{ __html: updatedHTML }}
          />
        </div>
      );
    }

    return null;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let elementHtml = clickedElement
        ? clickedElement.outerHTML
        : "선택한 요소가 없습니다.";

      if (clickedElement) {
        clickedElement.classList.remove(styles.DOMhighlighted);
        elementHtml = clickedElement.outerHTML;
        clickedElement.classList.add(styles.DOMhighlighted);
      }

      const promptContent = `
      # DOM Element
      ${elementHtml}

      # Prompt
      ${inputValue}
      `;

      const payload = { path: indexFileState.path, prompt: promptContent };

      console.log("Payload:", payload);

      const res = await fetch(
        "http://localhost:3000/user-templates/modify-file",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      alert("수정 사항이 전송되었습니다.");

      await fetchFileContent(indexFileState.path);
    } catch (error) {
      console.error("Failed to Submit:", error);
      alert("수정 사항 전송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const getPlaceholderText = () => {
    if (clickedElement) {
      return `${clickedElement.outerHTML}에 대해서 수정..`;
    } else {
      return "수정하고 싶은 내용을 입력하세요.";
    }
  };

  const handleCheckClick = () => {
    router.push("/dashboard");
  };

  return (
    <div className={styles.wrap}>
      {showOverlay && <div className={styles.overlay}></div>}
      {renderFileContent()}
      <div className={styles.editorWrap}>
        <form className={styles.form} onSubmit={handleEditSubmit}>
          <input
            className={styles.input}
            placeholder={getPlaceholderText()}
            value={inputValue}
            onChange={handleInputChange}
          />
          <Btn
            text={
              loading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faArrowRight} />
              )
            }
            background={"#4629f2"}
            textColor={"#FFF"}
            border={"none"}
            height={"3rem"}
            width={"5rem"}
          />
        </form>
        <Btn
          text={<FontAwesomeIcon icon={faCheck} />}
          background={"#222"}
          textColor={"#FFF"}
          border={"none"}
          height={"3rem"}
          width={"10%"}
          onClick={handleCheckClick}
        />
      </div>
    </div>
  );
};

export default GenerateBox;
