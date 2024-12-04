import Header from "../components/Header";
import ProfileBox from "../components/ProfileBox";
import styles from "../styles/Wrap.module.css";

export default function qna() {
  return (
    <div className={styles.wrap}>
      <Header />
      <ProfileBox />
    </div>
  );
}
