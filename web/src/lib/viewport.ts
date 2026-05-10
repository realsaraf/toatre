export const PHONE_MAX_VIEWPORT_WIDTH = 480;

export function isPhoneViewport(width: number) {
  return width <= PHONE_MAX_VIEWPORT_WIDTH;
}