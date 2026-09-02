import React from "react";
import { Menu, Bell, User } from "lucide-react";
interface TopbarProps {
  title: string;
  onMenuClick: () => void;
  hasNotifications?: boolean;
}
export const Topbar: React.FC<TopbarProps> = ({
  title,
  onMenuClick,
  hasNotifications = false,
}) => {
  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-border-subtle bg-background px-4">
      {" "}
      {/* Left Section: Mobile Menu & Title */}{" "}
      <div className="flex items-center gap-4">
        {" "}
        <button
          onClick={onMenuClick}
          className="flex items-center justify-center rounded-[12px] p-2 text-text-secondary hover:bg-surface-card hover:text-text-primary transition-colors lg:hidden"
          aria-label="Open menu"
        >
          {" "}
          <Menu size={20} />{" "}
        </button>{" "}
        <h1 className="text-lg font-bold text-text-primary tracking-tight uppercase">
          {" "}
          {title}{" "}
        </h1>{" "}
      </div>{" "}
      {/* Right Section: Actions */}{" "}
      <div className="flex items-center gap-2 sm:gap-4">
        {" "}
        {/* Notification Bell */}{" "}
        <button
          className="relative flex items-center justify-center rounded-full p-2.5 text-text-secondary transition-colors hover:bg-surface-card hover:text-text-primary"
          aria-label="Notifications"
        >
          {" "}
          <Bell size={20} />{" "}
          {hasNotifications && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-primary-lime shadow-[0_0_6px_#A8FF00] border-2 border-background" />
          )}{" "}
        </button>{" "}
        {/* Divider */} <div className="h-6 w-px bg-surface-raised mx-1" />{" "}
        {/* Profile Button */}{" "}
        <button
          className="flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-4 transition-colors hover:bg-surface-card border border-transparent hover:border-border-subtle"
          aria-label="User menu"
        >
          {" "}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-text-primary border border-border-subtle">
            {" "}
            <User size={18} />{" "}
          </div>{" "}
          <div className="hidden text-left sm:block">
            {" "}
            <p className="text-sm font-bold text-text-primary leading-none">
              Owner Account
            </p>{" "}
            <p className="text-[10px] text-text-primary uppercase tracking-widest mt-1">
              Manage Profile
            </p>{" "}
          </div>{" "}
        </button>{" "}
      </div>{" "}
    </header>
  );
};
