export const validateRequest = ({ body, params, query } = {}) => (req, res, next) => {
  try {
    if (body) {
      req.body = body.parse(req.body);
    }
    if (params) {
      req.params = params.parse(req.params);
    }
    if (query) {
      req.query = query.parse(req.query);
    }
    next();
  } catch (error) {
    next(error);
  }
};
