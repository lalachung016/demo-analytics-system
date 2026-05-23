import {
  getDashboardOverview,
  methodNotAllowed,
  parseYearParam,
} from '../../lib/dashboardMock.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, 'GET')
  }

  const year = parseYearParam(req.query.year)
  if (year === null) {
    return res.status(400).json({ error: 'year must be an integer between 2017 and 2026' })
  }

  const data = await getDashboardOverview(year)
  return res.status(200).json(data)
}
