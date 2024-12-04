import { useState, useReducer, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "./Dash.module.css";
import { FaEllipsisV, FaHeart, FaSearch, FaPlus } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faRotate,
  faShareFromSquare,
} from "@fortawesome/free-solid-svg-icons";

import Image from "next/image";
import Btn from "./Btn";
import Modal from "react-modal";
import { SkeletonDash } from "./Skeleton";
import { Tooltip } from "react-tooltip";

// 초기 상태 정의
const initialState = {
  templates: [],
  sortOrder: "최신순",
  searchQuery: "",
  isDeployModalOpen: false,
  deployName: "",
  showDeployed: false,
  showShared: false,
  dropdownOpen: null,
  isDeleteModalOpen: false,
  isRenameModalOpen: false,
  isShareModalOpen: false,
  selectedTemplate: null,
  pageName: "",
  category: "",
  description: "",
  loading: true,
  dashStructure: [],
  profileImage: "/profile.png",
  displayName: "",
  imageLoading: {},
  deployLoading: false,
  noDifferences: {},
};

// 리듀서 함수 정의
function reducer(state, action) {
  switch (action.type) {
    case "SET_TEMPLATES":
      return { ...state, templates: action.payload };
    case "SET_SORT_ORDER":
      return { ...state, sortOrder: action.payload };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "TOGGLE_DEPLOY_MODAL":
      return { ...state, isDeployModalOpen: !state.isDeployModalOpen };
    case "SET_DEPLOY_NAME":
      return { ...state, deployName: action.payload };
    case "TOGGLE_SHOW_DEPLOYED":
      return { ...state, showDeployed: !state.showDeployed };
    case "TOGGLE_SHOW_SHARED":
      return { ...state, showShared: !state.showShared };
    case "SET_DROPDOWN_OPEN":
      return { ...state, dropdownOpen: action.payload };
    case "TOGGLE_DELETE_MODAL":
      return { ...state, isDeleteModalOpen: !state.isDeleteModalOpen };
    case "TOGGLE_RENAME_MODAL":
      return { ...state, isRenameModalOpen: !state.isRenameModalOpen };
    case "TOGGLE_SHARE_MODAL":
      return { ...state, isShareModalOpen: !state.isShareModalOpen };
    case "SET_SELECTED_TEMPLATE":
      return { ...state, selectedTemplate: action.payload };
    case "SET_PAGE_NAME":
      return { ...state, pageName: action.payload };
    case "SET_CATEGORY":
      return { ...state, category: action.payload };
    case "SET_DESCRIPTION":
      return { ...state, description: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_PROFILE_IMAGE":
      return { ...state, profileImage: action.payload };
    case "SET_DISPLAY_NAME":
      return { ...state, displayName: action.payload };
    case "SET_IMAGE_LOADING":
      return { ...state, imageLoading: action.payload };
    case "SET_DEPLOY_LOADING":
      return { ...state, deployLoading: action.payload };
    case "SET_DASH_STRUCTURE":
      return { ...state, dashStructure: action.payload };
    case "SET_NO_DIFFERENCES":
      return {
        ...state,
        noDifferences: {
          ...state.noDifferences,
          ...action.payload,
        },
      };
    default:
      return state;
  }
}

const DropdownMenu = ({
  isDeployed, //배포 상태
  isShared, // 템플릿 공유 상태
  onEdit, // 편집 이동
  onDelete, // 삭제
  onDeploy, // 배포하기
  onUndeploy, // 배포 중지
  onShare, //공유하기
  onStopSharing, // 템플릿 공유 중지
  onRename, // 이름 변경
  template, // 선택한 템플릿 정보
}) => {
  const deploymentLink = `${template.deployPath}`;

  return (
    <div className={styles.dropdownMenu}>
      {/* 배포 상태에 따라 */}
      {isDeployed ? (
        <>
          <button onClick={onUndeploy}>배포 중지</button>
          <button onClick={() => window.open(deploymentLink, "_blank")}>
            배포 링크 공유
          </button>
        </>
      ) : isShared ? (
        <button onClick={() => onStopSharing(template.id)}>
          템플릿 공유 중지
        </button>
      ) : (
        <button onClick={onShare}>템플릿으로 공유</button>
      )}
      <button onClick={() => onEdit(template)}>프로젝트 편집</button>
      <button onClick={onDelete}>프로젝트 삭제</button>
      <button onClick={onRename}>이름 변경</button>
    </div>
  );
};

export default function Dash() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch("http://localhost:3000/auth/profile", {
          credentials: "include",
        });
        const data = await response.json();

        if (response.ok) {
          dispatch({
            type: "SET_PROFILE_IMAGE",
            payload: data.profileImageUrl || "/profile.png",
          });
          dispatch({
            type: "SET_DISPLAY_NAME",
            payload: data.displayName || "사용자",
          });
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchProfileData();
  }, []);

  useEffect(() => {
    const fetchDash = async () => {
      try {
        const res = await fetch(
          "http://localhost:3000/dashboards/dashboard/mydashboard",
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();

        const noDifferences = {};
        data.forEach((template) => {
          noDifferences[template.id] = !template.modified;
        });

        dispatch({ type: "SET_TEMPLATES", payload: data });
        dispatch({ type: "SET_NO_DIFFERENCES", payload: noDifferences });
        dispatch({
          type: "SET_DASH_STRUCTURE",
          payload: new Array(data.length).fill(null),
        });
        dispatch({ type: "SET_LOADING", payload: false });
      } catch (error) {
        console.error("Failed to fetch fetchDash:", error);
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };
    fetchDash();
  }, []);

  const checkDifferencesForTemplate = async (templateId) => {
    try {
      const res = await fetch("http://localhost:3000/deploy/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: templateId }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorMessage = await res.text();
        if (errorMessage.includes("No differences found")) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error(
        `Error checking differences for template ${templateId}:`,
        error
      );
      return false;
    }
  };

  const filteredTemplates = state.templates
    .filter((template) =>
      template.projectName
        .toLowerCase()
        .includes(state.searchQuery.toLowerCase())
    )
    .filter((template) => (state.showDeployed ? template.publish : true))
    .filter((template) => (state.showShared ? template.shared : true));

  const sortedTemplates = filteredTemplates.sort((a, b) => {
    if (state.sortOrder === "최신순") {
      return new Date(b.date) - new Date(a.date);
    } else if (state.sortOrder === "인기순") {
      return b.likes - a.likes;
    }
    return 0;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toISOString().split("T")[0];
  };

  const openDeployModal = (template) => {
    dispatch({ type: "SET_SELECTED_TEMPLATE", payload: template });
    dispatch({ type: "TOGGLE_DEPLOY_MODAL" });
  };

  const closeDeployModal = () => {
    dispatch({ type: "TOGGLE_DEPLOY_MODAL" });
  };

  const handleDeployTemplate = async () => {
    if (!state.deployName.trim()) {
      alert("배포할 이름을 입력하세요.");
      return;
    }

    dispatch({ type: "SET_DEPLOY_LOADING", payload: true });

    try {
      const payload = {
        deployName: state.deployName,
        id: state.selectedTemplate.id,
      };

      const res = await fetch("http://localhost:3000/deploy/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const updatedTemplate = await res.json();

      dispatch({
        type: "SET_TEMPLATES",
        payload: state.templates.map((t) =>
          t.id === state.selectedTemplate.id
            ? { ...t, publish: true, deployName: payload.deployName }
            : t
        ),
      });

      alert("배포가 성공적으로 완료되었습니다.");
      closeDeployModal();
    } catch (error) {
      console.error("Failed to deploy template:", error);
      alert("배포에 실패했습니다.");
    } finally {
      dispatch({ type: "SET_DEPLOY_LOADING", payload: false });
    }
  };

  const handleUndeployTemplate = async (templateId) => {
    try {
      const payload = { id: templateId };

      console.log("Payload:", payload);

      const res = await fetch("http://localhost:3000/deploy/undeploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      dispatch({
        type: "SET_TEMPLATES",
        payload: state.templates.map((template) =>
          template.id === templateId
            ? { ...template, publish: false }
            : template
        ),
      });

      alert("배포가 중지되었습니다.");
    } catch (error) {
      console.error("Failed to undeploy template:", error);
      alert("배포 중지에 실패했습니다.");
    }
  };

  const handleUpdateTemplate = async (templateId) => {
    try {
      const res = await fetch("http://localhost:3000/deploy/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: templateId }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorMessage = await res.text();

        if (errorMessage.includes("No differences found")) {
          dispatch({
            type: "SET_NO_DIFFERENCES",
            payload: { [templateId]: true },
          });
          alert("배포할 수정 내용이 없습니다.");
          return;
        }

        throw new Error(`HTTP error! status: ${res.status}`);
      }

      dispatch({
        type: "SET_NO_DIFFERENCES",
        payload: { [templateId]: true },
      });
      alert("배포가 업데이트 되었습니다.");
    } catch (error) {
      console.error("Failed to update deploy template:", error);
      if (error.message.includes("No differences found")) {
        alert("배포할 수정 내용이 없습니다.");
      } else {
        alert("배포 업데이트에 실패했습니다.");
      }
    }
  };

  const handleEditTemplate = (template) => {
    console.log("프로젝트 경로:", template.projectPath);
    router.push({
      pathname: "/gen",
      query: { projectPath: template.projectPath },
    });
  };

  const handleDeleteTemplate = async () => {
    try {
      if (state.selectedTemplate.publish) {
        await handleUndeployTemplate(state.selectedTemplate.id);
      }

      const res = await fetch(
        `http://localhost:3000/dashboards/dashboard/remove/${state.selectedTemplate.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      dispatch({
        type: "SET_TEMPLATES",
        payload: state.templates.filter(
          (template) => template.id !== state.selectedTemplate.id
        ),
      });

      console.log("Template deleted successfully:", state.selectedTemplate);
      closeDeleteModal();
    } catch (error) {
      console.error("Failed to delete template:", error);
      alert("프로젝트 삭제에 실패했습니다.");
    }
  };

  const openRenameModal = (template) => {
    dispatch({ type: "SET_SELECTED_TEMPLATE", payload: template });
    dispatch({ type: "TOGGLE_RENAME_MODAL" });
  };

  const closeRenameModal = () => {
    dispatch({ type: "TOGGLE_RENAME_MODAL" });
  };

  const handleRenameTemplate = async () => {
    if (!state.pageName.trim()) {
      alert("새로운 이름을 입력하세요.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3000/dashboards/${state.selectedTemplate.id}/name`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: state.pageName }),
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const updatedTemplate = await res.json();

      dispatch({
        type: "SET_TEMPLATES",
        payload: state.templates.map((template) =>
          template.id === updatedTemplate.id
            ? { ...template, projectName: updatedTemplate.projectName }
            : template
        ),
      });

      console.log("Template renamed successfully:", updatedTemplate);
      closeRenameModal();
    } catch (error) {
      console.error("Failed to rename template:", error);
      alert("이름 변경에 실패했습니다.");
    }
  };

  const openDeleteModal = (template) => {
    dispatch({ type: "SET_SELECTED_TEMPLATE", payload: template });
    dispatch({ type: "TOGGLE_DELETE_MODAL" });
  };

  const closeDeleteModal = () => {
    dispatch({ type: "TOGGLE_DELETE_MODAL" });
  };

  const openShareModal = (template) => {
    dispatch({ type: "SET_SELECTED_TEMPLATE", payload: template });
    dispatch({ type: "TOGGLE_SHARE_MODAL" });
  };

  const closeShareModal = () => {
    dispatch({ type: "TOGGLE_SHARE_MODAL" });
  };

  const handleShareTemplate = async () => {
    if (!state.category.trim() || !state.description.trim()) {
      alert("카테고리와 설명을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3000/dashboards/dashboard/${state.selectedTemplate.id}/share`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category: state.category,
            description: state.description,
          }),
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const sharedTemplate = await res.json();

      console.log("Template shared successfully:", sharedTemplate);
      closeShareModal();
      router.push("/temp");
    } catch (error) {
      console.error("Failed to share template:", error);
      alert("템플릿 공유에 실패했습니다.");
      dispatch({ type: "TOGGLE_SHARE_MODAL" });
    }
  };

  const handleStopSharingTemplate = async (templateId) => {
    try {
      const res = await fetch(
        `http://localhost:3000/dashboards/dashboard/${templateId}/share-stop`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      console.log("Template sharing stopped successfully:", templateId);

      dispatch({
        type: "SET_TEMPLATES",
        payload: state.templates.map((template) =>
          template.id === templateId ? { ...template, shared: false } : template
        ),
      });
    } catch (error) {
      console.error("Failed to stop sharing template:", error);
      alert("템플릿 공유 중지에 실패했습니다.");
    }
  };

  const toggleDropdown = (id) => {
    dispatch({
      type: "SET_DROPDOWN_OPEN",
      payload: state.dropdownOpen === id ? null : id,
    });
  };

  const customStyles = {
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 1000,
    },
    content: {
      width: "24rem",
      height: "max-content",
      margin: "auto",
      borderRadius: "1rem",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
      padding: "2rem",
      zIndex: 1001,
    },
  };

  return (
    <>
      <Modal
        isOpen={state.isDeleteModalOpen}
        onRequestClose={closeDeleteModal}
        style={customStyles}
      >
        <h1>정말로 삭제하겠습니까?</h1>
        <p>이 작업은 되돌릴 수 없습니다.</p>
        <div className={styles.modalButtons}>
          <button
            onClick={handleDeleteTemplate}
            className={styles.confirmButton}
          >
            예
          </button>
          <button onClick={closeDeleteModal} className={styles.cancelButton}>
            아니요
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={state.isRenameModalOpen}
        onRequestClose={closeRenameModal}
        style={customStyles}
      >
        <h1>이름을 변경하시겠습니까?</h1>
        <input
          className={styles.pageinputform}
          type="text"
          placeholder="이름 입력.."
          onChange={(e) =>
            dispatch({ type: "SET_PAGE_NAME", payload: e.target.value })
          }
        />
        <div className={styles.modalButtons}>
          <button
            onClick={handleRenameTemplate}
            className={styles.confirmButton}
          >
            예
          </button>
          <button onClick={closeRenameModal} className={styles.cancelButton}>
            아니요
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={state.isShareModalOpen}
        onRequestClose={closeShareModal}
        style={customStyles}
      >
        <h1>템플릿 공유</h1>
        <input
          className={styles.pageinputform}
          type="text"
          placeholder="카테고리 입력.."
          value={state.category}
          onChange={(e) =>
            dispatch({ type: "SET_CATEGORY", payload: e.target.value })
          }
        />
        <input
          className={styles.pageinputform}
          type="text"
          placeholder="설명 입력.."
          value={state.description}
          onChange={(e) =>
            dispatch({ type: "SET_DESCRIPTION", payload: e.target.value })
          }
        />
        <div className={styles.modalButtons}>
          <button
            onClick={handleShareTemplate}
            className={styles.confirmButton}
          >
            확인
          </button>
          <button onClick={closeShareModal} className={styles.cancelButton}>
            취소
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={state.isDeployModalOpen}
        onRequestClose={closeDeployModal}
        style={customStyles}
      >
        <h1>배포할 이름을 입력하세요</h1>
        <input
          className={styles.pageinputform}
          type="text"
          placeholder="배포 이름 입력.."
          value={state.deployName}
          onChange={(e) =>
            dispatch({ type: "SET_DEPLOY_NAME", payload: e.target.value })
          }
        />
        <div className={styles.modalButtons}>
          <button
            onClick={handleDeployTemplate}
            className={styles.confirmButton}
            disabled={state.deployLoading}
          >
            {state.deployLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              "확인"
            )}
          </button>
          <button onClick={closeDeployModal} className={styles.cancelButton}>
            취소
          </button>
        </div>
      </Modal>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>대시보드</h2>
        </div>
        <div className={styles.sectionControls}>
          <div className={styles.sectionLeft}>
            <Btn
              text={"최신순"}
              background={state.sortOrder === "최신순" ? "#4629F2" : "#fff"}
              border={"#4629F2"}
              textColor={state.sortOrder === "최신순" ? "#fff" : "#4629F2"}
              onClick={() =>
                dispatch({ type: "SET_SORT_ORDER", payload: "최신순" })
              }
            />
            <Btn
              text={"인기순"}
              background={state.sortOrder === "인기순" ? "#4629F2" : "#fff"}
              border={"#4629F2"}
              textColor={state.sortOrder === "인기순" ? "#fff" : "#4629F2"}
              onClick={() =>
                dispatch({ type: "SET_SORT_ORDER", payload: "인기순" })
              }
            />
            <div className={styles.switchContainer}>
              <label className={styles.switchLabel}>
                {state.showDeployed ? "배포 완료" : "배포: 모든 상태"}
              </label>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={state.showDeployed}
                  onChange={() => dispatch({ type: "TOGGLE_SHOW_DEPLOYED" })}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
            <div className={styles.switchContainer}>
              <label className={styles.switchLabel}>
                {state.showShared ? "템플릿으로 공유중" : "공유: 모든 상태"}
              </label>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={state.showShared}
                  onChange={() => dispatch({ type: "TOGGLE_SHOW_SHARED" })}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
          <div className={styles.sectionRight}>
            <div className={styles.searchWrap}>
              <div className={styles.searchBox}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="검색어를 입력하세요 ..."
                  value={state.searchQuery}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_SEARCH_QUERY",
                      payload: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
        {state.loading ? (
          <SkeletonDash dashStructure={state.dashStructure} />
        ) : (
          <div className={styles.grid}>
            {sortedTemplates.length === 0 ? (
              <>
                <Btn
                  icon={<FaPlus className={styles.likeIcon} />}
                  width={"14rem"}
                  text={"지금 웹페이지 생성하기!"}
                  background={"#000"}
                  border={"#000"}
                  textColor={"#fff"}
                  onClick={() => router.push("/")}
                />
              </>
            ) : (
              sortedTemplates.map((template) => (
                <div key={template.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardProfileWrap}>
                      <div className={styles.cardProfile}>
                        <Image
                          className={styles.cardProfileImg}
                          alt="profile"
                          layout="fill"
                          src={state.profileImage}
                        />
                      </div>
                    </div>
                    <div className={styles.cardHeaderInfo}>
                      <div className={styles.cardUser}>{state.displayName}</div>
                      <div className={styles.cardShareState}>
                        <div className={styles.cardShareState}>
                          <div
                            className={`${styles.cardShareStateCircle} ${
                              template.shared ? styles.shared : ""
                            }`}
                            data-tooltip-id={`tooltip-${template.id}`}
                            data-tooltip-content={
                              template.shared
                                ? "템플릿으로 공유 중입니다."
                                : "공유하고 있지 않습니다."
                            }
                          ></div>
                          <Tooltip
                            id={`tooltip-${template.id}`}
                            place="top"
                            effect="solid"
                          />
                        </div>
                      </div>
                    </div>
                    <div
                      className={styles.cardMenu}
                      style={{ position: "relative" }}
                    >
                      <button
                        className={styles.cardMenuButton}
                        onClick={() => toggleDropdown(template.id)}
                      >
                        <FaEllipsisV />
                      </button>
                      {state.dropdownOpen === template.id && (
                        <DropdownMenu
                          isDeployed={template.publish} //배포 상태
                          isShared={template.shared} //공유 상태
                          onShare={() => openShareModal(template)} //공유하기
                          onDeploy={() => openDeployModal(template)} //배포하기
                          onUndeploy={() => handleUndeployTemplate(template.id)} // 배포 중지
                          onEdit={handleEditTemplate} // 편집하기
                          onRename={() => openRenameModal(template)} //이름 변경
                          onDelete={() => openDeleteModal(template)} //삭제하기
                          onStopSharing={handleStopSharingTemplate} //공유 중지
                          template={template} //템플릿 데이터
                          noDifferences={state.noDifferences} // Pass this state
                        />
                      )}
                    </div>
                  </div>
                  <div className={styles.cardImage}>
                    <div className={styles.imageWrapper}>
                      {state.imageLoading[template.id] && (
                        <div className={styles.spinnerContainer}>
                          <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            className={styles.spinner}
                          />
                        </div>
                      )}
                      <Image
                        src={`http://localhost:3000${template.imagePath}`}
                        alt="Template Screenshot"
                        layout="fill"
                        objectFit="cover"
                        onLoadingComplete={() =>
                          dispatch({
                            type: "SET_IMAGE_LOADING",
                            payload: {
                              ...state.imageLoading,
                              [template.id]: false,
                            },
                          })
                        }
                      />
                      <div className={styles.cardImageBtn}>
                        <Btn
                          icon={<FontAwesomeIcon icon={faShareFromSquare} />}
                          text={"프로젝트 편집"}
                          background={"#333"}
                          border={"#333"}
                          textColor={"#fff"}
                          width={"7rem"}
                          onClick={() => handleEditTemplate(template)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.cardTitle}>
                      {template.projectName}
                    </div>
                    <div className={styles.cardSubhead}>
                      {formatDate(template.updatedAt)}
                    </div>
                    <p>{template.content}</p>
                  </div>
                  <div className={styles.cardFooter}>
                    <Btn
                      icon={<FaHeart className={styles.likeIcon} />}
                      text={template.likes}
                      background={"none"}
                      border={"#4629F2"}
                      textColor={"#4629F2"}
                    />
                    {template.publish ? (
                      <div className={styles.updateDeployBox}>
                        <Btn
                          text={"배포중지"}
                          background={"#c22"}
                          border={"#c22"}
                          textColor={"#fff"}
                          width="7rem"
                          onClick={() => handleUndeployTemplate(template.id)}
                        />
                        {state.noDifferences[template.id] ? (
                          <Btn
                            disabled={true}
                            text={<FontAwesomeIcon icon={faRotate} />}
                            background={"#999"}
                            border={"#999"}
                            textColor={"#fff"}
                            width="4rem"
                            onClick={() =>
                              console.log("변경할 내용이 없습니다.")
                            }
                          />
                        ) : (
                          <Btn
                            text={<FontAwesomeIcon icon={faRotate} />}
                            background={"#666"}
                            border={"#666"}
                            textColor={"#fff"}
                            width="4rem"
                            onClick={() => handleUpdateTemplate(template.id)}
                          />
                        )}
                      </div>
                    ) : (
                      <Btn
                        text={
                          state.deployLoading ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                          ) : (
                            "배포하기"
                          )
                        }
                        background={"#4629F2"}
                        border={"#4629F2"}
                        textColor={"#fff"}
                        width="7rem"
                        onClick={() => openDeployModal(template)}
                        disabled={state.deployLoading}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </>
  );
}
