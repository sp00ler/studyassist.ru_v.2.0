import re, math, sys
import sympy as sp
from sympy import Rational as R, Matrix, symbols, Function, exp, sin, cos, sqrt, pi, simplify, dsolve, Eq, diff, solve, binomial

TS = open(r'E:\ideas\studyassist_2.6.9\lib\problem-topics.ts', encoding='utf-8').read()
ok = 0
def check(name, cond):
    global ok
    assert cond, 'FAIL: ' + name
    ok += 1
    print('OK  ', name)
def has(s):
    assert s in TS, 'string missing in TS: ' + s

x, t, C = symbols('x t C')
y = Function('y')

# ---- 1. ODE
sol1 = x - 1 + 2*exp(-x)
check('ODE1 satisfies y\'+y=x', simplify(diff(sol1, x) + sol1 - x) == 0)
check('ODE1 y(0)=1', sol1.subs(x, 0) == 1)
ds = dsolve(Eq(y(x).diff(x) + y(x), x), y(x), ics={y(0): 1})
check('ODE1 dsolve agrees', simplify(ds.rhs - sol1) == 0)
check('ODE1 int x e^x', simplify(diff((x-1)*exp(x), x) - x*exp(x)) == 0)
has('y = x − 1 + 2e^(−x)')

sol2 = 2*exp(x) - exp(2*x)
check('ODE2 satisfies', simplify(diff(sol2, x, 2) - 3*diff(sol2, x) + 2*sol2) == 0)
check('ODE2 y(0)=1,y\'(0)=0', sol2.subs(x, 0) == 1 and diff(sol2, x).subs(x, 0) == 0)
check('ODE2 roots 1,2', set(solve(x**2 - 3*x + 2, x)) == {1, 2})
ds = dsolve(Eq(y(x).diff(x, 2) - 3*y(x).diff(x) + 2*y(x), 0), y(x), ics={y(0): 1, y(x).diff(x).subs(x, 0): 0})
check('ODE2 dsolve agrees', simplify(ds.rhs - sol2) == 0)
has('y = 2e^x − e^(2x)')

# ---- 2. Numerical methods
x0 = R(3, 2)
x1 = x0 - (x0**2 - 2)/(2*x0)
x2 = x1 - (x1**2 - 2)/(2*x1)
check('Newton x1=17/12', x1 == R(17, 12) and abs(float(x1) - 1.416667) < 1e-6)
check('Newton f(x1)=1/144, f\'=17/6', x1**2 - 2 == R(1, 144) and 2*x1 == R(17, 6))
check('Newton x2=577/408', x2 == R(577, 408) and abs(float(x2) - 1.414216) < 5e-7)
check('Newton error ~2.1e-6', abs(abs(float(x2) - math.sqrt(2)) - 2.1e-6) < 0.1e-6)
check('sqrt2 = 1.414214', abs(math.sqrt(2) - 1.414214) < 1e-6)
has('x₁ = 17/12 ≈ 1,416667; x₂ = 577/408 ≈ 1,414216')

h = 0.1
yy = 1.0; xx = 0.0
for _ in range(2):
    yy = yy + h*(xx + yy); xx += h
check('Euler y2=1.22', abs(yy - 1.22) < 1e-12)
ex = 2*math.exp(0.2) - 0.2 - 1
check('Euler exact 1.242806', abs(ex - 1.242806) < 1e-6)
check('Euler error 0.0228', abs((ex - yy) - 0.0228) < 5e-5)
check('exact solves y\'=x+y, y(0)=1',
      simplify(diff(2*exp(x) - x - 1, x) - (x + 2*exp(x) - x - 1)) == 0 and (2*exp(x) - x - 1).subs(x, 0) == 1)
check('Euler intermediate f(0.1,1.1)=1.2', abs((0.1 + 1.1) - 1.2) < 1e-12)
has('y(0,2) ≈ 1,22 (точное значение ≈ 1,2428, погрешность ≈ 0,023)')

# ---- 3. Linear algebra
A = Matrix([[2, 1, -1], [1, -1, 2], [3, 2, 1]]); b = Matrix([1, 5, 10])
D = A.det()
def rep(col):
    M = A.copy(); M[:, col] = b; return M.det()
Dx, Dy, Dz = rep(0), rep(1), rep(2)
check('Cramer determinants -10,-10,-20,-30', (D, Dx, Dy, Dz) == (-10, -10, -20, -30))
check('Cramer solution 1,2,3', (Dx/D, Dy/D, Dz/D) == (1, 2, 3) and A*Matrix([1, 2, 3]) == b)
check('Cramer minors step D', 2*(-1*1 - 2*2) - 1*(1*1 - 2*3) + (-1)*(1*2 - (-1)*3) == -10)
check('Cramer minors step Dx', 1*(-1*1 - 2*2) - 1*(5*1 - 2*10) + (-1)*(5*2 - (-1)*10) == -10)
check('Cramer minors step Dy', 2*(5*1 - 2*10) - 1*(1*1 - 2*3) + (-1)*(1*10 - 5*3) == -20)
check('Cramer minors step Dz', 2*(-1*10 - 5*2) - 1*(1*10 - 5*3) + 1*(1*2 - (-1)*3) == -30)
has('Δ = −10, Δx = −10, Δy = −20, Δz = −30; x = 1, y = 2, z = 3')

B = Matrix([[4, 1], [2, 3]])
lam = symbols('lam')
check('Eig charpoly l^2-7l+10', sp.expand(B.charpoly(lam).as_expr() - (lam**2 - 7*lam + 10)) == 0)
ev = B.eigenvects()
found = {}
for val, mult, vecs in ev:
    v = vecs[0]
    # normalise so first component is 1
    found[val] = tuple(v / v[0])
check('Eigen pairs', found == {2: (1, -2), 5: (1, 1)})
check('A v1 = 2 v1, A v2 = 5 v2', B*Matrix([1, -2]) == 2*Matrix([1, -2]) and B*Matrix([1, 1]) == 5*Matrix([1, 1]))
check('A v1 intermediate (2,-4)', tuple(B*Matrix([1, -2])) == (2, -4))
has('λ₁ = 2, v₁ = (1; −2); λ₂ = 5, v₂ = (1; 1)')

# ---- 4. Mathematical physics
a = symbols('a', positive=True)
u1 = 3*exp(-a**2*t)*sin(x) + 2*exp(-9*a**2*t)*sin(3*x)
check('Heat PDE satisfied', simplify(diff(u1, t) - a**2*diff(u1, x, 2)) == 0)
check('Heat BC', simplify(u1.subs(x, 0)) == 0 and simplify(u1.subs(x, pi)) == 0)
check('Heat IC', simplify(u1.subs(t, 0) - (3*sin(x) + 2*sin(3*x))) == 0)
# Fourier coefficients b_n = 2/pi * int f sin nx
f0 = 3*sin(x) + 2*sin(3*x)
bn = [sp.integrate(f0*sin(n*x), (x, 0, pi))*2/pi for n in range(1, 6)]
check('Heat Fourier coeffs 3,0,2,0,0', [sp.simplify(c) for c in bn] == [3, 0, 2, 0, 0])
has('u(x, t) = 3e^(−a²t)·sin x + 2e^(−9a²t)·sin 3x')

u2 = cos(4*t)*sin(2*x) + R(1, 2)*sin(2*t)*sin(x)
check('String PDE u_tt=4u_xx', simplify(diff(u2, t, 2) - 4*diff(u2, x, 2)) == 0)
check('String BC', simplify(u2.subs(x, 0)) == 0 and simplify(u2.subs(x, pi)) == 0)
check('String u(x,0)=sin2x', simplify(u2.subs(t, 0) - sin(2*x)) == 0)
check('String u_t(x,0)=sin x', simplify(diff(u2, t).subs(t, 0) - sin(x)) == 0)
check('String B1 = 1/2 via coefficient', R(1) / (2*1) == R(1, 2))
check('String u_tt expression', simplify(diff(u2, t, 2) - (-16*cos(4*t)*sin(2*x) - 2*sin(2*t)*sin(x))) == 0)
has('u(x, t) = cos 4t·sin 2x + (1/2)·sin 2t·sin x')

# ---- 5. Probability
pH = [R(5, 10), R(3, 10), R(2, 10)]; pA = [R(2, 100), R(3, 100), R(5, 100)]
PA = sum(p*q for p, q in zip(pH, pA))
check('Total probability 0.029', PA == R(29, 1000))
post = [p*q/PA for p, q in zip(pH, pA)]
check('Bayes H3 = 10/29', post[2] == R(10, 29) and abs(float(post[2]) - 0.3448) < 5e-5)
check('Bayes posteriors 10,9,10 /29 sum 1', post == [R(10, 29), R(9, 29), R(10, 29)] and sum(post) == 1)
has('P(A) = 0,029; P(H₃ | A) = 10/29 ≈ 0,345')

p, q = R(6, 10), R(4, 10)
check('Bernoulli C(5,3)=10', binomial(5, 3) == 10)
check('Bernoulli P(3)=0.3456', binomial(5, 3)*p**3*q**2 == R(3456, 10000))
check('Bernoulli 0.6^3*0.4^2 parts', p**3 == R(216, 1000) and q**2 == R(16, 100))
check('Bernoulli P(>=1)=0.98976', 1 - q**5 == R(98976, 100000) and q**5 == R(1024, 100000))
check('Bernoulli sum over k>=1 equals', sum(binomial(5, k)*p**k*q**(5-k) for k in range(1, 6)) == 1 - q**5)
has('P₅(3) = 0,3456; P(хотя бы одно попадание) = 0,98976')

# ---- 6. Theoretical mechanics: solve equilibrium equations
RA, RB = symbols('RA RB')
L = 6; F = 12; xF = 2; qq = 2
Q = qq*L
sol = solve([Eq(RB*L - F*xF - Q*R(L, 2), 0), Eq(RA + RB - F - Q, 0)], [RA, RB])
check('Beam reactions RA=14 RB=10', sol[RA] == 14 and sol[RB] == 10 and Q == 12)
check('Beam check moments about B', -14*6 + F*(L - xF) + Q*3 == 0)
has('R_A = 14 кН, R_B = 10 кН (обе вверх)')

T1, T2 = symbols('T1 T2', positive=True)
G = 100
sol = solve([Eq(T1*cos(pi/6) - T2*cos(pi/3), 0), Eq(T1*sin(pi/6) + T2*sin(pi/3), G)], [T1, T2])
check('Cables T1=50, T2=50*sqrt3', simplify(sol[T1] - 50) == 0 and simplify(sol[T2] - 50*sqrt(3)) == 0)
check('Cables T2 ~ 86.6', abs(float(sol[T2]) - 86.6) < 0.05)
check('Cables T2 = sqrt3 T1', simplify(sol[T2] - sqrt(3)*sol[T1]) == 0)
check('Cables check 43.3 and 25+75', abs(50*math.cos(math.pi/6) - 43.3) < 0.05 and abs(50*0.5 + 86.6*math.sqrt(3)/2 - 100) < 0.05)
has('T₁ = 50 Н, T₂ = 50√3 ≈ 86,6 Н')

# ---- 7. Electrical engineering
E1, E2, R1, R2, R3 = 12, 6, 2, 3, 6
UA, I1, I2, I3 = symbols('UA I1 I2 I3')
# Kirchhoff, currents directed from node B to node A through each branch
sol = solve([Eq(I1, (E1 - UA)/R1), Eq(I2, (E2 - UA)/R2), Eq(I3, (0 - UA)/R3), Eq(I1 + I2 + I3, 0)], [UA, I1, I2, I3])
check('Circuit U=8 V', sol[UA] == 8)
check('Circuit I1=2, I2=-2/3, I3=-4/3', (sol[I1], sol[I2], sol[I3]) == (2, R(-2, 3), R(-4, 3)))
check('Circuit two-node formula', R(E1, R1) + R(E2, R2) == 8 and R(1, R1) + R(1, R2) + R(1, R3) == 1)
Psrc = E1*sol[I1] + E2*sol[I2]
Pload = sol[I1]**2*R1 + sol[I2]**2*R2 + sol[I3]**2*R3
check('Circuit power balance 20 W', Psrc == 20 and Pload == 20 and 24 - 4 == 20 and R(4, 3) + R(32, 3) + 8 == 20)
check('Circuit -2/3 ~ -0.67, -4/3 ~ -1.33', abs(float(R(-2, 3)) + 0.67) < 0.005 and abs(float(R(-4, 3)) + 1.33) < 0.005)
has('U = 8 В; I₁ = 2 А, I₂ = −2/3 ≈ −0,67 А, I₃ = −4/3 ≈ −1,33 А')

Rr, XL, XC, U = 30, 60, 20, 100
Z = complex(Rr, XL - XC)
Zm = abs(Z); I = U/Zm; phi = math.degrees(math.atan2(XL - XC, Rr))
P = I**2*Rr; Qr = I**2*(XL - XC); S = U*I
check('RLC |Z|=50', abs(Zm - 50) < 1e-9)
check('RLC I=2', abs(I - 2) < 1e-9)
check('RLC phi=53.13', abs(phi - 53.13) < 0.005)
check('RLC P=120, Q=160, S=200', abs(P - 120) < 1e-9 and abs(Qr - 160) < 1e-9 and abs(S - 200) < 1e-9)
check('RLC sqrt(P2+Q2)=S, cos=0.6', abs(math.hypot(P, Qr) - S) < 1e-9 and abs(P/S - 0.6) < 1e-12)
has('|Z| = 50 Ом, I = 2 А, φ ≈ 53,13°, P = 120 Вт, Q = 160 вар, S = 200 В·А')

# ---- 8. Strength of materials
Lb, qb = 4, 10  # m, kN/m
Ra, Rb, M0 = symbols('Ra Rb M0')
sol = solve([Eq(Ra + Rb - qb*Lb, 0), Eq(Rb*Lb - R(qb*Lb*Lb, 2), 0)], [Ra, Rb])
check('Beam reactions 20/20', sol[Ra] == 20 and sol[Rb] == 20)
xs = symbols('xs')
Mx = sol[Ra]*xs - R(qb, 2)*xs**2
xstar = solve(diff(Mx, xs), xs)[0]
check('Beam Mmax at x=2, = 20 kN m = qL^2/8', xstar == 2 and Mx.subs(xs, xstar) == 20 and R(qb*Lb**2, 8) == 20)
check('Beam Q(x)=20-10x zero at 2', (20 - 10*xstar) == 0 and 20*xstar - 5*xstar**2 == 20)
Wm = R(100*200**2, 6)
check('Beam W = 666 667 mm3', abs(float(Wm) - 666667) < 1 and Wm == R(2000000, 3))
sigma = R(20*10**6)/Wm
check('Beam sigma = 30 MPa', sigma == 30)
has('R_A = R_B = 20 кН; M_max = 20 кН·м (в середине пролёта); σ_max = 30 МПа')

d, Lr, Fr, Er = 20, 2000, 50000, 200000  # mm, mm, N, MPa
Ar = math.pi*d**2/4
sg = Fr/Ar; eps = sg/Er; dl = eps*Lr
check('Rod A = 314.16 mm2', abs(Ar - 314.16) < 0.005)
check('Rod sigma = 159.15 MPa', abs(sg - 159.15) < 0.005)
check('Rod eps = 7.96e-4', abs(eps - 7.96e-4) < 0.005e-4)
check('Rod dL = 1.59 mm', abs(dl - 1.59) < 0.005 and abs(Fr*Lr/(Er*Ar) - dl) < 1e-12)
has('σ ≈ 159,15 МПа; ΔL ≈ 1,59 мм')

# ---- Metadata constraints
blocks = TS.split("    slug: '")[1:]
check('8 topics', len(blocks) == 8)
for blk in blocks:
    slug = blk.split("'")[0]
    title = re.search(r"title: '([^']*)'", blk)
    tt = re.search(r"\n    title: '(.*)',\n", blk).group(1)
    desc = re.search(r"description:\s*\n?\s*'(.*)',\n", blk).group(1)
    check(f'{slug}: title len {len(tt)} in 55..65', 55 <= len(tt) <= 65)
    check(f'{slug}: description len {len(desc)} in 140..160', 140 <= len(desc) <= 160)
    ex = blk.count('statement:')
    check(f'{slug}: 2 examples', ex == 2)
    pt = blk.split('problemTypes: [')[1].split(']')[0].count("',\n")
    check(f'{slug}: problemTypes {pt} in 6..10', 6 <= pt <= 10)
    cm = blk.split('commonMistakes: [')[1].split('\n    ],')[0].count("',\n")
    check(f'{slug}: commonMistakes {cm} in 4..6', 4 <= cm <= 6)
    faq = blk.count('      q: ') if False else blk.count('q: \'')
    check(f'{slug}: faq 4', faq == 4)
    for banned in ['купить', 'гарантир', 'отлично на', 'на заказ']:
        check(f'{slug}: banned word absent #{len(banned)}', banned not in blk.lower())

print(f'\nALL OK ({ok} checks)')
