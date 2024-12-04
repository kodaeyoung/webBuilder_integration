import Header from "../components/Header";
import Dash from "../components/Dash";
import styles from "../styles/Wrap.module.css";

export default function DashBoard() {
  return (
    <div className={styles.wrap}>
      <Header />
      <Dash showMoreButton={false} showCategories={true} />
    </div>
  );
}
