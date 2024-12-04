import Header from "../components/Header";
import styles from "../styles/Wrap.module.css";
import TeamBox from "../components/TeamBox";

export default function team() {
  return (
    <div className={styles.wrap}>
      <Header />
      <TeamBox />
    </div>
  );
}
