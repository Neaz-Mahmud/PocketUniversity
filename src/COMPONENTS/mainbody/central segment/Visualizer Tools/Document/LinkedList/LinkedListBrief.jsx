import styles from "./LinkedListBrief.module.css";

export default function LinkedListBrief() {
    return (
        <section className={styles.wrapper}>
            <div className={styles.badge}>Data Structures</div>

            <h2 className={styles.title}>Linked List</h2>

            <p className={styles.text}>
                Linked List হলো একটি linear data structure যেখানে data গুলো
                আলাদা আলাদা node আকারে থাকে। প্রতিটি node-এর মধ্যে সাধারণত
                দুইটি জিনিস থাকে — একটি হলো data, আরেকটি হলো next reference
                বা pointer, যা পরের node-কে নির্দেশ করে।
            </p>

            <p className={styles.text}>
                Array-এর মতো Linked List-এ elements contiguous memory-তে
                থাকে না। তাই insertion এবং deletion অনেক ক্ষেত্রে সহজ হয়,
                বিশেষ করে list-এর শুরুতে বা মাঝখানে।
            </p>

            <div className={styles.infoBox}>
                <h3 className={styles.infoTitle}>সংক্ষেপে</h3>
                <ul className={styles.list}>
                    <li>Node দিয়ে তৈরি হয়</li>
                    <li>প্রতিটি node পরের node-কে point করে</li>
                    <li>Dynamic size হতে পারে</li>
                    <li>Insertion/Deletion তুলনামূলক সহজ</li>
                    <li>Random access ধীর, কারণ শুরু থেকে traverse করতে হয়</li>
                </ul>
            </div>
        </section>
    );
}
``