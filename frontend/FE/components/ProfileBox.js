import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "./ProfileBox.module.css";

export default function ProfileBox() {
  const [profileData, setProfileData] = useState({
    displayName: "",
    profileImageUrl: "",
  });
  const router = useRouter();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch("http://localhost:3000/auth/profile", {
          credentials: "include",
        });
        const data = await response.json();

        if (response.ok) {
          setProfileData({
            displayName: data.displayName,
            profileImageUrl: data.profileImageUrl,
          });
        } else {
          console.error("Failed to fetch profile data");
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchProfileData();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:3000/auth/logout", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        console.log("로그아웃 성공");
        router.push("/");
      } else {
        console.error("로그아웃 실패");
      }
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
    }
  };

  return (
    <>
      <div className={styles.wrap}>
        <h1 className={styles.title}>회원 정보</h1>
        <div className={styles.listWrap}>
          <div className={styles.list}>
            <div className={styles.profileImgWrap}>
              {profileData.profileImageUrl && (
                <Image
                  src={profileData.profileImageUrl}
                  alt="Profile Image"
                  className={styles.profileImg}
                  layout="fill"
                  objectFit="cover"
                />
              )}
            </div>
            <div className={styles.profileInfoWrap}>
              <div className={styles.profileName}>
                {profileData.displayName}
              </div>
            </div>
          </div>
          <div className={styles.list} onClick={handleLogout}>
            로그아웃
          </div>
        </div>
      </div>
    </>
  );
}
