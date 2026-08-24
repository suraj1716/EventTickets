import { motion } from "framer-motion";
import { Link } from "@inertiajs/react";
import { useEffect } from "react";

export default function LandingPage() {

  useEffect(() => {
    if (window.location.hash === "#services") {
      const el = document.getElementById("services");
      if (el) {
        // slight delay ensures layout has settled before scrolling
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
      }
    }
  }, []);
  return (
    <div className="bg-gradient-to-br from-purple-200 via-pink-100 to-yellow-100 min-h-screen font-sans">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 to-purple-600 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1"
          >
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">\              High-Quality Printing for Every Purpose
            </h1>
            <p className="text-lg mb-6 max-w-md">
              Bring your ideas to life with premium prints, fast turnaround, and unbeatable service.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-white text-indigo-700 font-semibold px-6 py-3 rounded-full shadow hover:bg-indigo-100 transition"
            >
              Shop Now
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1"
          >
            <img
              src="/images/printing-hero.png"
              alt="Printing press hero"
              className="rounded-xl shadow-xl w-full"
            />
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-10 text-gray-800">Our Services</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { title: "Business Cards", image: "/images/cards.jpg" },
              { title: "Flyers & Brochures", image: "/images/flyers.jpg" },
              { title: "Posters & Banners", image: "/images/posters.jpg" },
              { title: "Booklets", image: "/images/booklets.jpg" },
              { title: "Custom Apparel", image: "/images/apparel.jpg" },
              { title: "Stickers & Labels", image: "/images/stickers.jpg" },
            ].map((service, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="bg-white border rounded-lg shadow-lg overflow-hidden"
              >
                <img
                  src={service.image}
                  alt={service.title}
                  className="h-52 w-full object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800">{service.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-100 to-pink-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-10">What Our Clients Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Emily R.", text: "Amazing print quality and service! My flyers turned out perfect." },
              { name: "Jason M.", text: "Fast turnaround and great customer support. Highly recommend!" },
              { name: "Sarah L.", text: "We loved the custom apparel for our team event. Thanks!" },
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-md"
              >
                <p className="text-gray-700 italic">"{testimonial.text}"</p>
                <p className="mt-4 font-semibold text-indigo-600">— {testimonial.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-indigo-700 text-white text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto px-4"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Print Something Great?</h2>
          <p className="mb-6">Let’s make your next print project your best yet. Start browsing today!</p>
          <Link
            href="/shop"
            className="inline-block bg-white text-indigo-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-100"
          >
            Browse Products
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
