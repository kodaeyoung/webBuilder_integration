import styles from "./LoginBox.module.css";
import Image from "next/image";
import Btn from "./Btn";

export default function LoginBox() {
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3000/auth/google";
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.imgBox}>
        <Image
          className={styles.img}
          alt="team"
          layout="fill"
          src={"/team.jpg"}
        />
      </div>
      <h1 className={styles.title}>
        <span>웹사이트 만들기,</span>
        <br /> <span className={styles.bold}>누구나 쉽게 할 수 있어요!</span>
      </h1>
      <div className={styles.btnWrap}>
        <Btn
          text={"구글 아이디로 시작하기"}
          background={"#000"}
          border={"000"}
          textColor={"#fff"}
          width={"20rem"}
          onClick={handleGoogleLogin}
        />
      </div>
    </div>
  );
}
