import Image from "next/image";
import logo from "../../website/public/pics/Logo moderne zelyweb fond transparent.png";

export function BrandLogo() {
  return <Image className="brand-image" src={logo} alt="Zelyweb" sizes="180px" />;
}
