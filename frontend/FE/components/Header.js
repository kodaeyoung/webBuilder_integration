import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import styles from "./Header.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faBars,
  faArrowRightToBracket,
  faPaintRoller,
  faLayerGroup,
  faGlobe,
  faHeadset,
  faTowerCell,
  faChildReaching,
  faUserEdit,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import Modal from "react-modal";

Modal.setAppElement("#__next");

export default function Header() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

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

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const handleLogoClick = () => {
    router.push("/");
  };

  return (
    <header className={styles.header}>
      <div className={styles.logoWrap} onClick={handleLogoClick}>
        <Image
          className={styles.logoImg}
          layout="fill"
          src="/logo.png"
          alt="0111-logo"
        />
      </div>
      <button className={styles.menuButton} onClick={togglePopup}>
        <FontAwesomeIcon icon={faBars} />
      </button>
      <Modal
        isOpen={isPopupOpen}
        onRequestClose={togglePopup}
        contentLabel="Menu"
        className={styles.modalContent}
        overlayClassName={styles.modalOverlay}
      >
        <ul className={styles.menuList}>
          <li className={styles.menuItem}>
            {isLoggedIn ? (
              <Link href="/profile" legacyBehavior>
                <a className={styles.menuLink}>
                  <FontAwesomeIcon
                    icon={faUserEdit}
                    className={styles.menuIcon}
                  />
                  회원 정보
                </a>
              </Link>
            ) : (
              <Link href="/login" legacyBehavior>
                <a className={styles.menuLink}>
                  <FontAwesomeIcon
                    icon={faArrowRightToBracket}
                    className={styles.menuIcon}
                  />
                  로그인
                </a>
              </Link>
            )}
          </li>
          <li className={styles.menuItem}>
            <Link href="/" legacyBehavior>
              <a className={styles.menuLink}>
                <FontAwesomeIcon
                  icon={faPaintRoller}
                  className={styles.menuIcon}
                />
                사이트 제작
              </a>
            </Link>
          </li>
          {isLoggedIn && (
            <li className={styles.menuItem}>
              <Link href="/dashboard" legacyBehavior>
                <a className={styles.menuLink}>
                  <FontAwesomeIcon
                    icon={faLayerGroup}
                    className={styles.menuIcon}
                  />
                  대시보드
                </a>
              </Link>
            </li>
          )}
          <li className={styles.menuItem}>
            <Link href="/temp" legacyBehavior>
              <a className={styles.menuLink}>
                <FontAwesomeIcon icon={faGlobe} className={styles.menuIcon} />
                템플릿 탐색
              </a>
            </Link>
          </li>
          <li className={styles.menuItem}>
            <Link href="/qna" legacyBehavior>
              <a className={styles.menuLink}>
                <FontAwesomeIcon icon={faHeadset} className={styles.menuIcon} />
                질문 및 답변
              </a>
            </Link>
          </li>
          <li className={styles.menuItem}>
            <Link href="/notice" legacyBehavior>
              <a className={styles.menuLink}>
                <FontAwesomeIcon
                  icon={faTowerCell}
                  className={styles.menuIcon}
                />
                공지사항
              </a>
            </Link>
          </li>
          <li className={styles.menuItem}>
            <Link href="/team" legacyBehavior>
              <a className={styles.menuLink}>
                <FontAwesomeIcon
                  icon={faChildReaching}
                  className={styles.menuIcon}
                />
                팀 소개
              </a>
            </Link>
          </li>
        </ul>
      </Modal>
    </header>
  );
}
