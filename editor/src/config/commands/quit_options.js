export const quitOptions = {
  ":qa!": () => ({ shouldReturn: true, shouldWrite: false }),
  ":qa": () => ({ shouldReturn: true, shouldWrite: false }),
  ":q": () => ({ shouldReturn: true, shouldWrite: false }),
  ":wq!": (bytes) => ({
    shouldReturn: true,
    shouldWrite: true,
    data: bytes,
  }),
  ":wq": (bytes) => ({
    shouldReturn: true,
    shouldWrite: true,
    data: bytes,
  }),
};
