import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import styles from "./layout.module.css";
import Button from "@/components/ui/Button";

export default function CommunityLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brandRow}>
          <div style={{ width: 20, height: 20, color: "var(--primary)" }}>
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fillRule="evenodd"></path>
              <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fillRule="evenodd"></path>
            </svg>
          </div>
          <span style={{ fontWeight: 700 }}>N.18 Inanam Community Hub</span>
        </div>
        <div className={styles.topbarActions}>
          <Button className={styles.reportBtn}>Report a New Issue</Button>
          <Image className={styles.avatar} alt="User" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC37nveW1T8IydQRZz7GWQBGOzblpUWT-dPtz4nkMGvR2BAvAUq1Ik6BRj-oOpg2Wm5-bSk9V6_SBkSzj0FZuG2L_mghpwLdxgUqTBo7Bi0vx0k9mbMno3RivnhWx-XbNi4VH-5GZsmfFC6fI4kDr-VwmmaQzuOKVTFlO-EIAQSpr71dE96KVj7C_V66UQSOy1WxDRgQ0xEqcnkKnWIhNr8wiqRClc5tVCtdn6rTi2COCjBJXlZHmxIvDgBxgYVFu_Ezm6OsGDAwR0" width={40} height={40} />
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <div className={styles.sideUserRow}>
              <Image className={styles.avatar} alt="User" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDYWyAzvZ-wTVEUM6E8b3eO9urEFiuvN8jNkmtLy4BCt1aVv064lWeDffuDjvZriNWbJgmBAVaMvIPesuvcprXjtHUf0XTzK8ZxPixPDfOBPKS1gQxQb_DMs8n4NzpqzfOz6aMCIQ50cTfH6L64TGMQUs4lx7Rr9QrBpOmvxMGbsD6a4sTXZqpbKQIUeTI925ONU23HJwzMKgbvzcIB6cy17WCTx5lZWHmrJnTlpLXK76uvydgLITrwBy5fkyfn5001FRSmdYLs5M" width={40} height={40} />
              <div>
                <p className={styles.sideUserName}>Amelia Tan</p>
                <p className={styles.sideUserRole}>Resident</p>
              </div>
            </div>
            <div className={styles.sideNav}>
              <Link className={`${styles.sideLink} ${styles.sideLinkActive}`} href="/community/dashboard">Dashboard</Link>
              <Link className={styles.sideLink} href="#">Report a New Issue</Link>
              <Link className={styles.sideLink} href="#">Community Updates</Link>
              <Link className={styles.sideLink} href="#">My Profile</Link>
            </div>
            <div className={styles.sideMeta}>
              <Link className={styles.sideLink} href="#">FAQ</Link>
              <Link className={styles.sideLink} href="#">Contact Support</Link>
              <Link className={styles.sideLink} href="#">Logout</Link>
            </div>
          </div>
        </aside>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
