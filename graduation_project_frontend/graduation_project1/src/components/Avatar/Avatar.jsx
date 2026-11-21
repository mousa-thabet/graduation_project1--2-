import "./Avatar.css";

/**
 * صورة الشخص إن رفعها، وإلا أول حرف من اسمه.
 * لا تحدد حجمًا ولا شكلًا: تملأ العنصر الذي حولها (دائرة المنشور، القائمة، صفحة الحساب...).
 * person: { name, avatar }
 */
function Avatar({ person }) {
  if (person.avatar) return <img className="avatar-img" src={person.avatar} alt="" />;

  return person.name.trim().charAt(0).toUpperCase();
}

export default Avatar;