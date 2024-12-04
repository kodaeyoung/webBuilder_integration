import styles from "../styles/Home.module.css";
import Header from "../components/Header";
import ChatComponent from "../components/ChatComponent";
import Templates from "../components/Templates";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>01:11</title>
        <meta
          name="description"
          content="01:11, 한시 십일분은 새로운 시작과 기회를 의미합니다."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content="01:11" />
        <meta
          property="og:description"
          content="인공지능을 사용한 홈페이지 자동 제작 플랫폼. 기술적인 장벽을 허물고, 누구나 자신의 아이디어를 표현할 수 있는 세상을 만듭니다."
        />
        <meta
          property="og:image"
          content="https://0111.site/_next/image?url=%2Flogo.png&w=3840&q=75"
        />
        <meta property="og:url" content="https:/0111.site" />
      </Head>
      <div className={styles.container}>
        <Header />
        <ChatComponent />
        <Templates showMoreButton={true} showCategories={false} />
      </div>
    </>
  );
}
