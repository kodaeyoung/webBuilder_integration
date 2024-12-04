import styles from "./TeamBox.module.css";
import Image from "next/image";

export default function TeamBox() {
  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>팀 소개</h2>
        </div>
        <h1 className={styles.title}>
          나만의 웹사이트를 누구나 <br /> 만들 수 있는 세상을 만들어요.
        </h1>
        <div className={styles.imgBox}>
          <Image
            className={styles.img}
            alt="team"
            layout="fill"
            src={"/team.jpg"}
          />
        </div>
        <div className={styles.descWrap}>
          <p>
            우리는 기술의 벽을 허물고, 웹사이트 제작의 문턱을 낮춰 누구나
            자신만의 공간을 인터넷에 마련할 수 있도록 돕습니다.
          </p>
          <p>
            사용자가 원하는대로 손쉽게 조정하고 디자인할 수 있는 플랫폼을
            제공하여, IT 지식이 전혀 없는 사람도 자신의 아이디어를 웹사이트로
            구현할 수 있게 합니다. 이제, 당신의 창의력만 있으면 됩니다. 우리와
            함께라면, 웹의 세계는 더 이상 멀고 어렵지 않습니다.
          </p>
        </div>
      </div>
    </>
  );
}
