import Link from "next/link";
import { getItems } from "@/lib/storage";
import { isAdminAuthed } from "@/lib/auth";
import LoginForm from "./LoginForm";
import AdminPanel from "./AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = isAdminAuthed();
  const items = authed ? await getItems() : [];

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1 className="title">관리자</h1>
          <div className="subtitle">월드컵 후보를 추가/수정/삭제할 수 있습니다</div>
        </div>
        <Link className="btn ghost" href="/"><span className="arrow-back">←</span>처음으로</Link>
      </header>

      {authed ? <AdminPanel initialItems={items} /> : <LoginForm />}
    </main>
  );
}
