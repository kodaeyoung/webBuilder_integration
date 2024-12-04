import Header from "../components/Header";
import Templates from "../components/Templates";
import styles from "../styles/Wrap.module.css";

export default function Temp() {
  return (
    <div className={styles.wrap}>
      <Header />
      <Templates showMoreButton={false} showCategories={true} />
    </div>
  );
}
