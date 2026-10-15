import Image from "next/image";
import { brand } from "@/config/brand.config";
import logo from "../../public/pics/Logo moderne zelyweb fond transparent.png";
export function Logo() {
  return (
    <span className="logo">
      <Image src={logo} alt={brand.name} sizes="(max-width: 767px) 144px, 168px" />
    </span>
  );
}
