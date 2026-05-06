export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    path: req.originalUrl,
  });
};
