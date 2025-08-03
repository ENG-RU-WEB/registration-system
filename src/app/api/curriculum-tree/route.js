// app/api/curriculum-tree/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(req) {
  const username = req.headers.get('x-username') // client ต้องส่ง STD_CODE มาใน header
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 })

  const stdPrefix = parseInt(username.slice(0, 2))
  const CUR_YEAR = stdPrefix >= 65 ? 65 : 60

  const { data: studentData, error: studentError } = await supabase
    .from('student')
    .select('MAJOR_NO')
    .eq('STD_CODE', username)
    .single()

  if (studentError || !studentData) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const MAJOR_NO = studentData.MAJOR_NO

  const { data: curriculumData, error: curriculumError } = await supabase
    .from('curriculum')
    .select('*')
    .eq('CUR_YEAR', CUR_YEAR)
    .eq('CUR_OWNER', MAJOR_NO)

  if (curriculumError || !curriculumData) {
    return NextResponse.json({ error: 'Curriculum not found' }, { status: 404 })
  }

  const tree = {}

  for (const row of curriculumData) {
    const { CATEGORY_NAME, GROUP_NAME, SUBGROUP_NAME, MODULE, CATEGORY_CREDIT } = row

    const lvl1 = CATEGORY_NAME
    const lvl2 = GROUP_NAME ? `${CATEGORY_NAME} → ${GROUP_NAME}` : null
    const lvl3 = SUBGROUP_NAME ? `${lvl2} → ${SUBGROUP_NAME}` : null
    const lvl4 = MODULE ? `${lvl3} → ${MODULE}` : null

    if (!tree[lvl1]) tree[lvl1] = {}

    if (lvl4) {
      tree[lvl1][lvl2] = tree[lvl1][lvl2] || {}
      tree[lvl1][lvl2][lvl3] = tree[lvl1][lvl2][lvl3] || {}
      tree[lvl1][lvl2][lvl3][lvl4] = { credit: CATEGORY_CREDIT }
    } else if (lvl3) {
      tree[lvl1][lvl2] = tree[lvl1][lvl2] || {}
      tree[lvl1][lvl2][lvl3] = { credit: CATEGORY_CREDIT }
    } else if (lvl2) {
      tree[lvl1][lvl2] = { credit: CATEGORY_CREDIT }
    } else {
      tree[lvl1]['credit'] = CATEGORY_CREDIT
    }
  }

  return NextResponse.json(tree)
}
