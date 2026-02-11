const Logo = ({ className, style, size = "1em" }) => (
    <img
        src="/smarthire_logo.png"
        alt="SmartHire"
        className={className}
        style={{
            ...style,
            height: size,
            width: "auto",
            objectFit: "contain",
            display: "block"
        }}
    />
);

export default Logo;
