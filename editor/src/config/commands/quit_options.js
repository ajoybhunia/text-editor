export const quitOptions = {
  ":q": () => ({ shouldReturn: true, shouldWrite: false }),
  ":q!": () => ({ shouldReturn: true, shouldWrite: false }),
  ":qa": () => ({ shouldReturn: true, shouldWrite: false }),
  ":qa!": () => ({ shouldReturn: true, shouldWrite: false }),
  ":w": (bytes) => ({
    shouldReturn: false,
    shouldWrite: true,
    forceWrite: false,
    data: bytes,
  }),
  ":w!": (bytes) => ({
    shouldReturn: false,
    shouldWrite: true,
    forceWrite: true,
    data: bytes,
  }),
  ":wq!": (bytes) => ({
    shouldReturn: true,
    shouldWrite: true,
    forceWrite: true,
    data: bytes,
  }),
  ":wq": (bytes) => ({
    shouldReturn: true,
    shouldWrite: true,
    forceWrite: false,
    data: bytes,
  }),
};
