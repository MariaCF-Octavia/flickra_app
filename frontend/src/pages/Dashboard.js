import React, { useState } from "react";
import { Link } from "react-router-dom";

// Imported assets (from your original code)
import adsvid from "../assets/adsvid.mp4";
import chanel from "../assets/chanel.jpg";
import dances from "../assets/dances.mp4";
import dolce from "../assets/dolceg.jpg";
import hoodie from "../assets/hoodie.jpg";
import lambo from "../assets/lambo.mp4";
import lambo2 from "../assets/lambo2.mp4";
import makeup from "../assets/makeup.jpg";
import paints from "../assets/paints.jpg";
import perfume from "../assets/perfume.jpg";
import perfumes from "../assets/perfumes.jpg";
import rollsroyce from "../assets/rollsroyce.mp4";
import saletoday from "../assets/saletoday.mp4";
import tshirt from "../assets/tshirt.jpg";
import vidvid from "../assets/vidvid.mp4";

const HomeDashboard = () => {
  const [theme, setTheme] = useState("dark"); // Default theme is dark

  // Theme styles
  const themeStyles = {
    dark: {
      bg: "bg-gray-950",
      text: "text-white",
      cardBg: "bg-gray-900",
      button: "bg-blue-600 hover:bg-blue-700",
    },
    light: {
      bg: "bg-gray-100",
      text: "text-gray-900",
      cardBg: "bg-white",
      button: "bg-blue-500 hover:bg-blue-600",
    },
  };

  const currentTheme = themeStyles[theme];

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text}`}>
      {/* Navigation Bar */}
      <nav className="flex justify-between items-center p-6">
        <div className="text-2xl font-bold">Content Factory</div>
        <div className="flex items-center space-x-6">
          <Link to="/login" className="hover:underline">
            Login
          </Link>
          <Link
            to="/signup"
            className={`px-4 py-2 rounded-lg ${currentTheme.button} text-white`}
          >
            Sign Up
          </Link>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center text-center">
        <video
          autoPlay
          loop
          muted
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        >
          <source src={lambo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="relative z-10 max-w-4xl px-4">
          <h1 className="text-5xl font-bold mb-6">
            Create, Edit, and Monetize Content Faster with AI
          </h1>
          <p className="text-xl mb-8">
            Generate videos, images, text, and voiceovers in minutes. Connect
            your social media, track performance, and unlock new revenue streams
            with the Content Factory Marketplace.
          </p>
          <Link
            to="/signup"
            className={`px-8 py-3 rounded-lg ${currentTheme.button} text-white font-semibold`}
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className={`py-16 ${currentTheme.cardBg}`}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Content Factory?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
                🤖
              </div>
              <h3 className="text-xl font-bold mb-2">
                AI-Powered Content Generation
              </h3>
              <p className="text-gray-400">
                Generate videos, images, and text in seconds with cutting-edge
                AI tools.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
                📱
              </div>
              <h3 className="text-xl font-bold mb-2">
                Seamless Social Media Integration
              </h3>
              <p className="text-gray-400">
                Connect your accounts and post directly to YouTube, Facebook,
                and TikTok.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
                📊
              </div>
              <h3 className="text-xl font-bold mb-2">Real-Time Analytics</h3>
              <p className="text-gray-400">
                Track performance and optimize your content strategy with
                real-time insights.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
                💰
              </div>
              <h3 className="text-xl font-bold mb-2">
                Monetize Your Content
              </h3>
              <p className="text-gray-400">
                Sell templates, videos, and images on the Content Factory
                Marketplace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plans and Pricing Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Plans & Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`p-8 rounded-lg ${currentTheme.cardBg}`}>
              <h3 className="text-2xl font-bold mb-4">Basic</h3>
              <p className="text-4xl font-bold mb-4">$29<span className="text-lg">/month</span></p>
              <ul className="mb-8">
                <li>Generate up to 10 videos/month</li>
                <li>Basic editing tools</li>
                <li>Connect 1 social media account</li>
              </ul>
              <button
                className={`w-full py-3 rounded-lg ${currentTheme.button} text-white`}
              >
                Start with Basic
              </button>
            </div>
            <div className={`p-8 rounded-lg ${currentTheme.cardBg} border-2 border-blue-500`}>
              <h3 className="text-2xl font-bold mb-4">Premium</h3>
              <p className="text-4xl font-bold mb-4">$79<span className="text-lg">/month</span></p>
              <ul className="mb-8">
                <li>Unlimited video generation</li>
                <li>Advanced editing tools</li>
                <li>Connect up to 3 social media accounts</li>
                <li>Real-time analytics</li>
              </ul>
              <button
                className={`w-full py-3 rounded-lg ${currentTheme.button} text-white`}
              >
                Go Premium
              </button>
            </div>
            <div className={`p-8 rounded-lg ${currentTheme.cardBg}`}>
              <h3 className="text-2xl font-bold mb-4">Exclusive</h3>
              <p className="text-4xl font-bold mb-4">$199<span className="text-lg">/month</span></p>
              <ul className="mb-8">
                <li>Everything in Premium</li>
                <li>Early access to new features</li>
                <li>Priority support</li>
                <li>Marketplace seller privileges</li>
              </ul>
              <button
                className={`w-full py-3 rounded-lg ${currentTheme.button} text-white`}
              >
                Choose Exclusive
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className={`py-16 ${currentTheme.cardBg}`}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <img
                src={makeup}
                alt="Jane Doe"
                className="w-24 h-24 rounded-full mx-auto mb-4"
              />
              <p className="text-gray-400 mb-4">
                "Content Factory has completely transformed how I create content.
                I can now generate high-quality videos in minutes!"
              </p>
              <p className="font-bold">— Jane Doe</p>
            </div>
            <div className="text-center">
              <img
                src={chanel}
                alt="John Smith"
                className="w-24 h-24 rounded-full mx-auto mb-4"
              />
              <p className="text-gray-400 mb-4">
                "The analytics dashboard is a game-changer. I can now track
                performance and optimize my content strategy effortlessly."
              </p>
              <p className="font-bold">— John Smith</p>
            </div>
            <div className="text-center">
              <img
                src={perfume}
                alt="Sarah Lee"
                className="w-24 h-24 rounded-full mx-auto mb-4"
              />
              <p className="text-gray-400 mb-4">
                "The Marketplace is amazing! I’ve already made $500 selling
                templates and videos."
              </p>
              <p className="font-bold">— Sarah Lee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 ${currentTheme.cardBg}`}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            &copy; 2024 Content Factory. All rights reserved.
          </p>
          <button
            onClick={scrollToTop}
            className={`mt-4 px-4 py-2 rounded-lg ${currentTheme.button} text-white`}
          >
            Back to Top
          </button>
        </div>
      </footer>
    </div>
  );
};

export default HomeDashboard;