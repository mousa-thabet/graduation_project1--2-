// قوائم المتابعين ومن يتابعهم (محسوبة من البيانات التجريبية ومن متابعاتي الحقيقية)
import { PEOPLE } from "../data/studyPeople.js";

// isMe: الحساب حسابي  •  person: صاحب الحساب  •  me: أنا  •  myFollowing: أرقام من أتابعهم
// people: كل الأشخاص (ادرس معي افتراضيًا، والتواصل يرسل أشخاصه بمتابعاتهم الخاصة)

export function getFollowingList({ isMe, person, me, myFollowing, people = PEOPLE }) {
  if (isMe) return people.filter((item) => myFollowing.includes(item.id));

  const list = people.filter((item) => person.follows.includes(item.id));
  // إن كان يتابعني أظهر أنا أيضًا في قائمته
  return person.followsMe ? [...list, me] : list;
}

export function getFollowersList({ isMe, person, me, myFollowing, people = PEOPLE }) {
  if (isMe) return people.filter((item) => item.followsMe);

  const list = people.filter((item) => item.follows.includes(person.id));
  // إن كنت أتابعه أظهر أنا أيضًا في متابعيه
  return myFollowing.includes(person.id) ? [...list, me] : list;
}