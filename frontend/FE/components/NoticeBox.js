import { useEffect, useState } from "react";
import styles from "./NoticeBox.module.css";
import { FaChevronDown, FaChevronUp, FaSearch } from "react-icons/fa";
import Btn from "./Btn";

const ITEMS_PER_PAGE = 3;

export default function NoticeBox() {
  const [templates, setTemplates] = useState([]);
  const [sortOrder, setSortOrder] = useState("최신순");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedItems, setExpandedItems] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTemplates, setFilteredTemplates] = useState([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      const res = await fetch("/api/data?filename=notices");
      const data = await res.json();
      setTemplates(data);
    };

    fetchTemplates();
  }, []);

  useEffect(() => {
    const filterTemplates = () => {
      const filtered = templates.filter((template) =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTemplates(filtered);
    };

    filterTemplates();
  }, [searchQuery, templates]);

  const sortedTemplates = filteredTemplates.sort((a, b) => {
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
    resetExpandedItems();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    resetExpandedItems();
  };

  return (
    <>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>공지사항</h2>
        </div>
        <div className={styles.sectionControls}>
          <div className={styles.sectionLeft}>
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
                    {template.date} | 조회수 {template.view}회
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
