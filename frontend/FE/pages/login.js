import Header from "../components/Header";
import LoginBox from "../components/LoginBox";
import styles from "../styles/Wrap.module.css";

export default function Login() {
  return (
    <div className={styles.wrap}>
      <Header />
      <LoginBox />
    </div>
  );
}
