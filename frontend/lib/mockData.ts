export const statCards = [
  { title: "Total Orders", value: "₹1,26,500", growth: 34.7, icon: "📦" },
  { title: "Active Orders", value: "₹1,26,500", growth: 34.7, icon: "🔄" },
  { title: "Completed Orders", value: "₹1,26,500", growth: 34.7, icon: "✅" },
  { title: "Return Orders", value: "₹1,26,500", growth: 34.7, icon: "↩️" },
];

export const salesData = {
  weekly: [
    { name: "Mon", sales: 40 },
    { name: "Tue", sales: 80 },
    { name: "Wed", sales: 60 },
    { name: "Thu", sales: 120 },
    { name: "Fri", sales: 90 },
    { name: "Sat", sales: 150 },
    { name: "Sun", sales: 110 },
  ],
  monthly: [
    { name: "Jul", sales: 80 },
    { name: "Aug", sales: 100 },
    { name: "Sep", sales: 120 },
    { name: "Oct", sales: 130 },
    { name: "Nov", sales: 160 },
    { name: "Dec", sales: 380 },
  ],
  yearly: [
    { name: "2019", sales: 200 },
    { name: "2020", sales: 280 },
    { name: "2021", sales: 320 },
    { name: "2022", sales: 400 },
    { name: "2023", sales: 380 },
  ],
};

export const bestSellers = [
  { name: "Lorem Ipsum", price: "₹126.60", sales: 599, image: "/placeholder.png" },
  { name: "Lorem Ipsum", price: "₹126.60", sales: 599, image: "/placeholder.png" },
  { name: "Lorem Ipsum", price: "₹126.60", sales: 599, image: "/placeholder.png" },
];

export const recentOrders = [
  { product: "Lorem Ipsum", orderId: "#25426", date: "Nov 8th, 2023", customer: "Kevin", avatar: "K", status: "Delivered", amount: "₹200.08" },
  { product: "Lorem Ipsum", orderId: "#25425", date: "Nov 7th, 2023", customer: "Kamael", avatar: "K", status: "Cancelled", amount: "₹200.08" },
  { product: "Lorem Ipsum", orderId: "#25424", date: "Nov 6th, 2023", customer: "Nikhil", avatar: "N", status: "Delivered", amount: "₹200.08" },
  { product: "Lorem Ipsum", orderId: "#25423", date: "Nov 5th, 2023", customer: "Shivani", avatar: "S", status: "Cancelled", amount: "₹200.08" },
  { product: "Lorem Ipsum", orderId: "#25422", date: "Nov 4th, 2023", customer: "Shehlab", avatar: "S", status: "Delivered", amount: "₹200.08" },
  { product: "Lorem Ipsum", orderId: "#25421", date: "Nov 2nd, 2023", customer: "Yogesh", avatar: "Y", status: "Delivered", amount: "₹200.08" },
];

export const products = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: "Lorem Ipsum",
  category: i % 3 === 0 ? "Primary" : i % 3 === 1 ? "Battery" : "Primary",
  price: "₹1768.80",
  summary: "Lorem ipsum is a great for afternoon complement to meet only small mobile projects.",
  sales: 1200 + i * 50,
  remaining: 1100 + i * 30,
  image: "/placeholder-product.png",
}));
