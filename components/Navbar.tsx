import Image from "next/image";
import React, { memo } from "react";

import ActiveUsers from "./users/ActiveUsers";
import { NavbarProps } from "@/types/type";

const Navbar = ({ activeElement }: NavbarProps) => {
	return (
		<nav className="flex select-none items-center justify-between gap-4 bg-primary-black px-5 text-white">
			<Image
				src="/assets/logo.svg"
				alt="Document Builder Logo"
				width={58}
				height={20}
			/>
			<ActiveUsers />
		</nav>
	);
};

export default memo(
	Navbar,
	(prevProps, nextProps) => prevProps.activeElement === nextProps.activeElement
);
