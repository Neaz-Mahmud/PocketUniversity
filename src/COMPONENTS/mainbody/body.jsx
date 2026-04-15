
import styles from "./Body.module.css";
function Body() {

    return (<>
        <main className={styles.content}>
            <div className={styles.card}>
                <h1>Welcome to Pocket University</h1>
                <p>Your page content will be here.</p>
            </div>
        </main>
    </>)

}

export default Body;