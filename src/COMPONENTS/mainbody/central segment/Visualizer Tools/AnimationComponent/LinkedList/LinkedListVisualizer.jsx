import { useState } from "react";
import styles from "./LinkedListVisualizer.module.css";

const INITIAL_NODES = ["10", "20", "30"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function LinkedListVisualizer() {
    const [nodes, setNodes] = useState(INITIAL_NODES);

    const [newValue, setNewValue] = useState("");
    const [insertValue, setInsertValue] = useState("");
    const [indexValue, setIndexValue] = useState("");
    const [searchValue, setSearchValue] = useState("");

    const [highlightIndex, setHighlightIndex] = useState(null);
    const [isTraversing, setIsTraversing] = useState(false);

    const [message, setMessage] = useState(
        "HEAD প্রথম node-কে point করে। প্রতিটি node-এর মধ্যে data এবং next reference থাকে।"
    );

    const addFront = () => {
        const value = newValue.trim();

        if (!value) {
            setMessage("আগে একটি value লিখো, তারপর Add Front চাপো।");
            return;
        }

        const next = [value, ...nodes];
        setNodes(next);
        setHighlightIndex(0);
        setMessage(`"${value}" list-এর শুরুতে যোগ হয়েছে। এখন এটিই নতুন HEAD node।`);
        setNewValue("");
    };

    const addEnd = () => {
        const value = newValue.trim();

        if (!value) {
            setMessage("আগে একটি value লিখো, তারপর Add End চাপো।");
            return;
        }

        const next = [...nodes, value];
        setNodes(next);
        setHighlightIndex(next.length - 1);
        setMessage(`"${value}" list-এর শেষে যোগ হয়েছে। শেষ node-এর next হলো NULL।`);
        setNewValue("");
    };

    const insertAtIndex = () => {
        const value = insertValue.trim();
        const index = Number(indexValue);

        if (!value) {
            setMessage("Insert করতে হলে একটি value দিতে হবে।");
            return;
        }

        if (indexValue === "" || Number.isNaN(index)) {
            setMessage("একটি valid index দাও।");
            return;
        }

        if (index < 0 || index > nodes.length) {
            setMessage(`Index অবশ্যই 0 থেকে ${nodes.length} এর মধ্যে হতে হবে।`);
            return;
        }

        const next = [...nodes];
        next.splice(index, 0, value);

        setNodes(next);
        setHighlightIndex(index);
        setMessage(
            `"${value}" index ${index} position-এ insert হয়েছে। এর আগের node এখন এই নতুন node-কে point করবে।`
        );

        setInsertValue("");
        setIndexValue("");
    };

    const removeFront = () => {
        if (nodes.length === 0) {
            setMessage("List খালি। Remove Front করা যাবে না।");
            return;
        }

        const removed = nodes[0];
        const next = nodes.slice(1);

        setNodes(next);
        setHighlightIndex(next.length > 0 ? 0 : null);
        setMessage(
            `"${removed}" শুরু থেকে remove হয়েছে। এখন পরের node নতুন HEAD হয়েছে।`
        );
    };

    const removeEnd = () => {
        if (nodes.length === 0) {
            setMessage("List খালি। Remove End করা যাবে না।");
            return;
        }

        const removed = nodes[nodes.length - 1];
        const next = nodes.slice(0, -1);

        setNodes(next);
        setHighlightIndex(next.length > 0 ? next.length - 1 : null);
        setMessage(
            `"${removed}" শেষ থেকে remove হয়েছে। এখন নতুন last node-এর next হলো NULL।`
        );
    };

    const searchNode = () => {
        const value = searchValue.trim();

        if (!value) {
            setMessage("Search করার জন্য একটি value লিখো।");
            return;
        }

        const foundIndex = nodes.indexOf(value);

        if (foundIndex === -1) {
            setHighlightIndex(null);
            setMessage(`"${value}" এই value টি list-এ পাওয়া যায়নি।`);
            return;
        }

        setHighlightIndex(foundIndex);
        setMessage(
            `"${value}" index ${foundIndex} position-এ পাওয়া গেছে। Search করতে হলে linked list সাধারণত শুরু থেকে traverse করতে হয়।`
        );
    };

    const removeByValue = () => {
        const value = searchValue.trim();

        if (!value) {
            setMessage("Remove করার জন্য একটি value লিখো।");
            return;
        }

        const foundIndex = nodes.indexOf(value);

        if (foundIndex === -1) {
            setHighlightIndex(null);
            setMessage(`"${value}" remove করা যায়নি কারণ এটি list-এ নেই।`);
            return;
        }

        const next = [...nodes];
        next.splice(foundIndex, 1);

        setNodes(next);
        setHighlightIndex(null);
        setMessage(
            `"${value}" remove হয়েছে। Remove by value করলে সাধারণত প্রথম matching node-টি remove হয়।`
        );
        setSearchValue("");
    };

    const traverseList = async () => {
        if (isTraversing) return;

        if (nodes.length === 0) {
            setMessage("List খালি। Traverse করার কিছু নেই।");
            return;
        }

        setIsTraversing(true);
        setMessage("Traversal শুরু হয়েছে। একের পর এক node দেখা হবে।");

        for (let i = 0; i < nodes.length; i++) {
            setHighlightIndex(i);
            setMessage(`Traversal: এখন index ${i} এর node "${nodes[i]}" দেখা হচ্ছে।`);
            await sleep(700);
        }

        setMessage("Traversal শেষ। Linked List-এ সাধারণত node by node এগোতে হয়।");
        await sleep(400);
        setHighlightIndex(null);
        setIsTraversing(false);
    };

    const resetExample = () => {
        setNodes(INITIAL_NODES);
        setNewValue("");
        setInsertValue("");
        setIndexValue("");
        setSearchValue("");
        setHighlightIndex(null);
        setIsTraversing(false);
        setMessage(
            "Example list reset হয়েছে। HEAD প্রথম node-কে point করে এবং শেষ node-এর next হলো NULL।"
        );
    };

    return (
        <section className={styles.wrapper}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <div className={styles.badge}>Interactive Visualizer</div>
                    <h2 className={styles.title}>Linked List Visualizer</h2>
                    <p className={styles.subtitle}>
                        Node, pointer, HEAD, NULL — সবকিছু চোখে দেখে বুঝতে পারবে।
                    </p>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Visual side */}
                <div className={styles.visualCard}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>Visual Linked List</h3>
                        <p className={styles.cardText}>
                            প্রতিটি node-এর ভিতরে <strong>data</strong> এবং{" "}
                            <strong>next</strong> অংশ দেখানো হয়েছে।
                        </p>
                    </div>

                    <div className={styles.listScroll}>
                        {nodes.length === 0 ? (
                            <div className={styles.emptyList}>
                                List এখন খালি। নতুন value add করে শুরু করো।
                            </div>
                        ) : (
                            <div className={styles.listRow}>
                                <div className={styles.startPointer}>HEAD</div>
                                <div className={styles.arrow}>→</div>

                                {nodes.map((node, index) => (
                                    <div key={`${node}-${index}`} className={styles.segment}>
                                        <div
                                            className={`${styles.node} ${highlightIndex === index ? styles.activeNode : ""
                                                }`}
                                        >
                                            <div className={styles.cell}>
                                                <span className={styles.cellLabel}>data</span>
                                                <span className={styles.cellValue}>{node}</span>
                                            </div>

                                            <div className={`${styles.cell} ${styles.pointerCell}`}>
                                                <span className={styles.cellLabel}>next</span>
                                                <span className={styles.cellValue}>
                                                    {index === nodes.length - 1 ? "NULL" : "addr"}
                                                </span>
                                            </div>
                                        </div>

                                        {index !== nodes.length - 1 && (
                                            <div className={styles.arrow}>→</div>
                                        )}
                                    </div>
                                ))}

                                <div className={styles.nullBox}>NULL</div>
                            </div>
                        )}
                    </div>

                    <div className={styles.legend}>
                        <span className={styles.legendItem}>
                            <strong>HEAD</strong> প্রথম node-কে point করে
                        </span>
                        <span className={styles.legendItem}>
                            <strong>NULL</strong> মানে list শেষ
                        </span>
                        <span className={styles.legendItem}>
                            <strong>addr</strong> মানে next node-এর reference
                        </span>
                    </div>
                </div>

                {/* Control side */}
                <div className={styles.controlCard}>
                    <div className={styles.statusBox}>
                        <h3 className={styles.statusTitle}>এখন কী হচ্ছে?</h3>
                        <p className={styles.statusText}>{message}</p>
                    </div>

                    {/* Add */}
                    <div className={styles.controlGroup}>
                        <h4 className={styles.groupTitle}>Add Node</h4>
                        <input
                            type="text"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            placeholder="নতুন value"
                            className={styles.input}
                            disabled={isTraversing}
                        />

                        <div className={styles.buttonRow}>
                            <button
                                type="button"
                                className={styles.primaryBtn}
                                onClick={addFront}
                                disabled={isTraversing}
                            >
                                Add Front
                            </button>

                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={addEnd}
                                disabled={isTraversing}
                            >
                                Add End
                            </button>
                        </div>
                    </div>

                    {/* Insert at index */}
                    <div className={styles.controlGroup}>
                        <h4 className={styles.groupTitle}>Insert at Index</h4>

                        <div className={styles.splitInputs}>
                            <input
                                type="text"
                                value={insertValue}
                                onChange={(e) => setInsertValue(e.target.value)}
                                placeholder="value"
                                className={styles.input}
                                disabled={isTraversing}
                            />

                            <input
                                type="number"
                                value={indexValue}
                                onChange={(e) => setIndexValue(e.target.value)}
                                placeholder="index"
                                className={styles.input}
                                disabled={isTraversing}
                            />
                        </div>

                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={insertAtIndex}
                            disabled={isTraversing}
                        >
                            Insert
                        </button>
                    </div>

                    {/* Search / remove by value */}
                    <div className={styles.controlGroup}>
                        <h4 className={styles.groupTitle}>Search / Remove by Value</h4>

                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="যে value খুঁজবে বা remove করবে"
                            className={styles.input}
                            disabled={isTraversing}
                        />

                        <div className={styles.buttonRow}>
                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={searchNode}
                                disabled={isTraversing}
                            >
                                Search
                            </button>

                            <button
                                type="button"
                                className={styles.dangerBtn}
                                onClick={removeByValue}
                                disabled={isTraversing}
                            >
                                Remove by Value
                            </button>
                        </div>
                    </div>

                    {/* Basic operations */}
                    <div className={styles.controlGroup}>
                        <h4 className={styles.groupTitle}>Basic Operations</h4>

                        <div className={styles.buttonRow}>
                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={removeFront}
                                disabled={isTraversing}
                            >
                                Remove Front
                            </button>

                            <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={removeEnd}
                                disabled={isTraversing}
                            >
                                Remove End
                            </button>

                            <button
                                type="button"
                                className={styles.primaryBtn}
                                onClick={traverseList}
                                disabled={isTraversing}
                            >
                                {isTraversing ? "Traversing..." : "Traverse"}
                            </button>

                            <button
                                type="button"
                                className={styles.ghostBtn}
                                onClick={resetExample}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Learning note */}
            <div className={styles.noteBox}>
                <h3 className={styles.noteTitle}>Student Tip</h3>
                <p className={styles.noteText}>
                    Linked List-এ direct index access fast না। কারণ সাধারণত node-গুলো
                    sequentially traverse করে target node-এ পৌঁছাতে হয়। কিন্তু insertion
                    এবং deletion কিছু ক্ষেত্রে array-এর তুলনায় easier হতে পারে।
                </p>
            </div>
        </section>
    );
}