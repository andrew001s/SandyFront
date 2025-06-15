'use client';

import { motion } from 'framer-motion';
import { LuGithub } from "react-icons/lu";
import Link from 'next/link';
import { FaDiscord, FaFacebook, FaInstagram, FaTwitch, FaXTwitter, FaYoutube } from "react-icons/fa6";

export const Footer = () => {
  const socialLinks = [
    {
      name: 'GitHub',
      url: 'https://github.com/andrew001s',
      icon: (
       <LuGithub  size={24} />
      ),      hoverClass: 'hover:bg-[#24292e]/20 hover:shadow-[0_0_50px_rgba(36,41,46,0.6)]',
    },
    {
      name: 'Twitter',
      url: 'https://x.com/ElShandrew',
      icon: (
        <FaXTwitter size={24} />
      ),
      hoverClass: 'hover:bg-black/20 hover:shadow-[0_0_50px_rgba(0,0,0,0.6)]',
    },
    {
      name: 'Twitch',
      url: 'https://www.twitch.tv/elshandrew',
      icon: (
        <FaTwitch size={24} />
      ),
      hoverClass: 'hover:bg-[#9146FF]/20 hover:shadow-[0_0_50px_rgba(145,70,255,0.6)]',
    },
    {
      name: 'YouTube',
      url: 'https://www.youtube.com/@Shandrew',
      icon: (
        <FaYoutube size={24} />
      ),
      hoverClass: 'hover:bg-[#FF0000]/20 hover:shadow-[0_0_50px_rgba(255,0,0,0.6)]',
    },
     {
      name: 'Instagram',
      url: 'https://www.instagram.com/elshandrew/',
      icon: (
        <FaInstagram size={24} />
      ),
      hoverClass: 'hover:bg-[#E4405F]/20 hover:shadow-[0_0_50px_rgba(228,64,95,0.6)]',
    },
     {
      name: 'Discord',
      url: 'https://discord.com/invite/KtCBAfneRy',
      icon: (
        <FaDiscord size={24} />
      ),
      hoverClass: 'hover:bg-[#7289DA]/20 hover:shadow-[0_0_50px_rgba(114,137,218,0.6)]',
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/Shandrewvt',
      icon: (
        <FaFacebook size={24} />
      ),
      hoverClass: 'hover:bg-[#1877F2]/20 hover:shadow-[0_0_50px_rgba(24,119,242,0.6)]',
    },
  ];

  return (
    <footer className="w-full py-6 px-4 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-sm text-gray-500 dark:text-gray-400"
        >
          © Shandrew {new Date().getFullYear()}. Todos los derechos reservados.
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center space-x-4"
        >
          {socialLinks.map((link) => (
            <Link
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white dark:text-gray-400 dark:hover:text-white transition-all"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-full ${link.hoverClass} transition-colors duration-300`}
              >
                {link.icon}
                <span className="sr-only">{link.name}</span>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>
    </footer>
  );
};
