export const getRandomColor = (a = 200) => {
  const leading = (s: string) => (s.length < 2 ? '0' + s : s);
  const x = Math.floor(Math.random() * 256);
  const y = Math.floor(Math.random() * 256);
  const z = Math.floor(Math.random() * 256);
  return '#' + leading(x.toString(16)) + leading(y.toString(16)) + leading(z.toString(16)) + leading(a.toString(16));
};
