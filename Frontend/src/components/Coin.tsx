import coinFace from "@/assets/coin-face.png";

export function Coin() {
  return (
    <div className="coin-stage relative grid place-items-center w-full h-full">
      {/* Ambient atmospheric glow */}
      <div className="coin-aurora" aria-hidden />
      <div className="coin-beam" aria-hidden />

      <div className="coin-wrap float-y">
        <div className="coin-spin">
          <img
            src={coinFace}
            alt=""
            className="coin-img"
            width={520}
            height={520}
            draggable={false}
          />
          {/* Specular sweep */}
          <div className="coin-spec" aria-hidden />
          {/* Rim highlight */}
          <div className="coin-rim" aria-hidden />
        </div>
        {/* Floor reflection */}
        <div className="coin-floor" aria-hidden>
          <img src={coinFace} alt="" className="coin-img-mirror" draggable={false} />
        </div>
        {/* Contact shadow */}
        <div className="coin-shadow" aria-hidden />
      </div>

      {/* Orbiting particles */}
      <div className="coin-orbit" aria-hidden>
        <span /><span /><span />
      </div>
    </div>
  );
}
