import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function Community() {
  return (
    <>
      <Navbar />

      <div className="page-layout">
        <Sidebar />

        <div className="feed-col">
          {/* Composer, TimeTabs, PostList will go here next */}
        </div>
      </div>
    </>
  );
}
