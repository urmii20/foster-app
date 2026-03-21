export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-12 py-8 text-[#E22726] text-xs font-bold uppercase tracking-widest">
      <div className="flex gap-12">
        <a href="#" className="hover:underline">Home</a>
        <a href="#" className="hover:underline">Blog</a>
        <a href="#" className="hover:underline">About Us</a>
        <a href="/UserCalendar" className="hover:underline">Calendar</a>
      </div>
      
      <div className="flex items-center gap-12">
        <a href="#" className="hover:underline">Favorites</a>
        <button className="border-2 border-[#E22726] rounded-full px-8 py-2 hover:bg-[#E22726] hover:text-[#F5F5EC] transition">
          Login
        </button>
      </div>
    </nav>
  );
}