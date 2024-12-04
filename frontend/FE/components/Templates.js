import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "./Templates.module.css";
import { FaHeart, FaSearch, FaShare } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faRotate,
  faShareFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import Btn from "./Btn";
import Link from "next/link";
import Modal from "react-modal";
import { SkeletonTemplates } from "./Skeleton";

export default function Templates({ showMoreButton, showCategories }) {
  const [templates, setTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("모든 카테고리");
  const [sortOrder, setSortOrder] = useState("최신순");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [pageName, setPageName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [templateStructure, setTemplateStructure] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [categories, setCategories] = useState(["모든 카테고리"]);

  const router = useRouter();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch(
          "http://localhost:3000/templates/sharedTemplates/get",
          {
            method: "get",
          }
        );
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setTemplates(data);
        const extractedCategories = [
          "모든 카테고리",
          ...new Set(data.map((template) => template.category)),
        ];
        setCategories(extractedCategories);

        setTemplateStructure(new Array(data.length).fill(null));
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch("http://localhost:3000/auth/profile", {
          credentials: "include",
        });
        const data = await response.json();

        if (response.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  const filteredTemplates = templates
    .filter(
      (template) =>
        selectedCategory === "모든 카테고리" ||
        template.category === selectedCategory
    )
    .filter(
      (template) =>
        template.displayName &&
        template.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const sortedTemplates = filteredTemplates.sort((a, b) => {
    if (sortOrder === "최신순") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortOrder === "인기순") {
      return b.likes - a.likes;
    }
    return 0;
  });

  const openModal = (templateId) => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setSelectedTemplateId(templateId);
    setModalContent("페이지 이름을 입력해주세요!");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toISOString().split("T")[0];
  };

  const handleConfirm = async () => {
    if (!selectedTemplateId || !pageName) {
      alert("페이지 이름을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/templates/sharedTemplates/${selectedTemplateId}/use`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pageName }),
          credentials: "include",
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Saved Template Path:", result);
        closeModal();
        router.push("/dashboard");
      } else {
        console.error("Failed to save template:", response.statusText);
      }
    } catch (error) {
      console.error("Error during the fetch operation:", error);
    }
  };

  const customStyles = {
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    content: {
      width: "500px",
      height: "270px",
      margin: "auto",
      borderRadius: "10px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
      padding: "20px",
    },
  };

  const getProfileImageUrl = (url) => {
    return url && url !== "null" ? url : "/profile.png";
  };

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className={styles.modalContent}
        overlayClassName={styles.modalOverlay}
      >
        <form
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleConfirm();
            }
          }}
        >
          <h2>페이지 이름을 입력해주세요!</h2>
          <div>
            <input
              className={styles.pageinputform}
              type="text"
              placeholder="이름 입력.."
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
            />
            <div className={styles.modalButtons}>
              <button
                type="button"
                className={styles.confirmButton}
                onClick={handleConfirm}
              >
                확인
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={closeModal}
              >
                닫기
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>템플릿 탐색</h2>
          {showMoreButton && (
            <Link className href={"/temp"} legacyBehavior>
              <a className={styles.moreBtn}>
                <Btn
                  text={"더보기"}
                  background={"none"}
                  border={"none"}
                  textColor={"#000"}
                  textBorder={true}
                />
              </a>
            </Link>
          )}
        </div>
        {showCategories && (
          <div className={styles.categoriesWrapper}>
            <div className={styles.categories}>
              {categories.map((category) => (
                <div
                  key={category}
                  className={`${styles.category} ${
                    selectedCategory === category ? styles.activeCategory : ""
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className={styles.sectionControls}>
          <div className={styles.sectionLeft}>
            <Btn
              text={"최신순"}
              background={sortOrder === "최신순" ? "#4629F2" : "#fff"}
              border={"#4629F2"}
              textColor={sortOrder === "최신순" ? "#fff" : "#4629F2"}
              onClick={() => setSortOrder("최신순")}
            />
            <Btn
              text={"인기순"}
              background={sortOrder === "인기순" ? "#4629F2" : "#fff"}
              border={"#4629F2"}
              textColor={sortOrder === "인기순" ? "#fff" : "#4629F2"}
              onClick={() => setSortOrder("인기순")}
            />
          </div>
          <div className={styles.sectionRight}>
            <div className={styles.searchWrap}>
              <div className={styles.searchBox}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="검색어를 입력하세요 ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        {loading ? (
          <SkeletonTemplates templateStructure={templateStructure} />
        ) : (
          <div className={styles.grid}>
            {sortedTemplates.map((template) => (
              <div key={template.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardProfileWrap}>
                    <div className={styles.cardProfile}>
                      <Image
                        className={styles.cardProfileImg}
                        alt="profile"
                        layout="fill"
                        src={getProfileImageUrl(template.profileImageUrl)}
                      />
                    </div>
                  </div>
                  <div className={styles.cardHeaderInfo}>
                    <div className={styles.cardUser}>
                      {template.displayName}
                    </div>
                  </div>
                </div>
                <div className={styles.cardImage}>
                  <div className={styles.imageWrapper}>
                    <Image
                      src={`http://localhost:3000${template.imagePath}`}
                      alt="Template Screenshot"
                      layout="fill"
                      objectFit="cover"
                    />
                    <div className={styles.cardImageBtn}>
                      <Btn
                        icon={<FontAwesomeIcon icon={faShareFromSquare} />}
                        text={"템플릿 사용"}
                        background={"#333"}
                        border={"#333"}
                        textColor={"#fff"}
                        width={"7rem"}
                        onClick={() => openModal(template.id)}
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.cardTitle}>
                    {template.templateName}
                  </div>
                  <div className={styles.cardSubhead}>
                    {formatDate(template.updatedAt)}
                  </div>
                  <p>{template.description}</p>
                </div>
                <div className={styles.cardFooter}>
                  <Btn
                    icon={<FaHeart className={styles.likeIcon} />}
                    text={template.likes}
                    background={"none"}
                    border={"#4629F2"}
                    textColor={"#4629F2"}
                  />
                  <Btn
                    text={"템플릿 사용"}
                    background={"#4629F2"}
                    border={"#4629F2"}
                    textColor={"#fff"}
                    width="7rem"
                    onClick={() => openModal(template.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
