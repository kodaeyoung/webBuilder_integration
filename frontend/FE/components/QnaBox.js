import { useEffect, useState } from "react";
import styles from "./QnaBox.module.css";
import { FaChevronDown, FaChevronUp, FaSearch } from "react-icons/fa";
import Btn from "./Btn";
import Modal from "react-modal";

const ITEMS_PER_PAGE = 3;

export default function QnaBox() {
  const [templates, setTemplates] = useState([]);
  const [sortOrder, setSortOrder] = useState("최신순");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedItems, setExpandedItems] = useState({});
  const [showMyQuestions, setShowMyQuestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    const fetchTemplates = async () => {
      const res = await fetch("/api/data?filename=qnas");
      const data = await res.json();
      setTemplates(data);
    };

    fetchTemplates();
  }, []);

  const maskEmail = (email) => {
    const [localPart, domain] = email.split("@");
    const maskedLocalPart =
      localPart.length > 2
        ? localPart[0] + localPart[1] + "*".repeat(4)
        : localPart[0] + "*".repeat(5);
    return `${maskedLocalPart}@${domain}`;
  };

  const sortedTemplates = templates
    .filter(
      (template) =>
        (!showMyQuestions || template.writer === "user1@example.com") &&
        template.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "최신순") {
        return new Date(b.date) - new Date(a.date);
      } else if (sortOrder === "조회순") {
        return b.view - a.view;
      }
      return 0;
    });

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTemplates = sortedTemplates.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(sortedTemplates.length / ITEMS_PER_PAGE);

  const toggleExpand = (id) => {
    setExpandedItems((prevExpandedItems) => ({
      ...prevExpandedItems,
      [id]: !prevExpandedItems[id],
    }));
  };

  const resetExpandedItems = () => {
    setExpandedItems({});
  };

  const handleSortChange = (order) => {
    setSortOrder(order);
    setCurrentPage(1);
    setShowMyQuestions(false);
    resetExpandedItems();
  };

  const handleShowMyQuestions = () => {
    setShowMyQuestions(true);
    setSortOrder("");
    setCurrentPage(1);
    resetExpandedItems();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    resetExpandedItems();
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const qna = ({ title, question }) => {
    axios.post("/api/data?filename=qnas", {
      title: title,
      description: question,
    });
  };

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="질문 입력"
        className={styles.modalContent}
        overlayClassName={styles.modalOverlay}
      >
        <form>
          <h2>어떤 점이 궁금하신가요?</h2>
          <input
            className={styles.qnatitleinput}
            type="text"
            placeholder="제목을 입력하세요."
            onChange={(e) => {
              setTitle(e.target.value);
            }}
          />
          <div>
            <textarea
              className={styles.qnainput}
              type="text"
              placeholder="질문 내용을 입력하세요."
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className={styles.modalButtons}>
              <button
                className={styles.confirmButton}
                onClick={() => qna(title, question)}
              >
                등록
              </button>
              <button className={styles.cancelButton} onClick={closeModal}>
                취소
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>질문 및 답변</h2>
        </div>
        <div className={styles.sectionControls}>
          <div className={styles.sectionLeft}>
            <Btn
              text={"질문 작성"}
              background={"#000"}
              border={"#000"}
              textColor={"#fff"}
              onClick={openModal}
            />
            <Btn
              text={"최신순"}
              background={sortOrder === "최신순" ? "#4629F2" : "#fff"}
              border={"#4629F2"}
              textColor={sortOrder === "최신순" ? "#fff" : "#4629F2"}
              onClick={() => handleSortChange("최신순")}
            />
            <Btn
              text={"조회순"}
              background={sortOrder === "조회순" ? "#4629F2" : "#fff"}
              border={"#4629F2"}
              textColor={sortOrder === "조회순" ? "#fff" : "#4629F2"}
              onClick={() => handleSortChange("조회순")}
            />
            <Btn
              text={"나의 질문"}
              background={showMyQuestions ? "#4629F2" : "#fff"}
              border={"#4629F2"}
              textColor={showMyQuestions ? "#fff" : "#4629F2"}
              onClick={handleShowMyQuestions}
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
        <div className={styles.listWrap}>
          {paginatedTemplates.map((template) => (
            <div key={template.id} className={styles.card}>
              <div className={styles.questionWrap}>
                <div className={styles.titleWrap}>
                  <div className={styles.title}>{template.title}</div>
                  <div className={styles.date}>
                    {template.date} | 조회수 {template.view}회 |{" "}
                    {maskEmail(template.writer)}
                  </div>
                </div>
                <div className={styles.iconWrap}>
                  <button
                    className={styles.icon}
                    onClick={() => toggleExpand(template.id)}
                  >
                    {expandedItems[template.id] ? (
                      <FaChevronUp />
                    ) : (
                      <FaChevronDown />
                    )}
                  </button>
                </div>
              </div>
              {expandedItems[template.id] && (
                <div className={styles.answerWrap}>
                  <p className={styles.contents}>{template.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className={styles.pagination}>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              className={`${styles.pageButton} ${
                currentPage === index + 1 ? styles.active : ""
              }`}
              onClick={() => handlePageChange(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
