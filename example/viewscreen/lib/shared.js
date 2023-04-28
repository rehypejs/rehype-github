/**
 * @typedef Size
 *   Size.
 * @property {number} width
 *   Width.
 * @property {number} height
 *   Height.
 *
 * @typedef ContentMessage
 *   Message sent to viewscreen with data.
 * @property {'content'} type
 *   Kind.
 * @property {string} id
 *   Viewscreen ID.
 * @property {string} value
 *   Value.
 *
 * @typedef RejectMessage
 *   Message sent from viewscreen when it rejects.
 * @property {'reject'} type
 *   Kind.
 * @property {string} id
 *   Viewscreen ID.
 * @property {string} value
 *   Reason.
 *
 * @typedef ResolveMessage
 *   Message sent from viewscreen when it resolves.
 * @property {'resolve'} type
 *   Kind.
 * @property {string} id
 *   Viewscreen ID.
 *
 * @typedef ResizeMessage
 *   Message sent from viewscreen with a preferred size.
 * @property {'resize'} type
 *   Kind.
 * @property {string} id
 *   Viewscreen ID.
 * @property {Size} value
 *   Size.
 *
 * @typedef {ContentMessage} ToViewscreenMessage
 *   Messages sent from outside parent window to viewscreen iframe.
 * @typedef {RejectMessage | ResizeMessage | ResolveMessage} FromViewscreenMessage
 *   Messages sent from inside viewscreen iframe to the parent window.
 */

export {}
