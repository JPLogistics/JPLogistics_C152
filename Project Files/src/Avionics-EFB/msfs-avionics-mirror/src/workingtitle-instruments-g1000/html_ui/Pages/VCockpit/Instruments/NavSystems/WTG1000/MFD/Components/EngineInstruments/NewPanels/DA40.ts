export const xmlConfig = `
<EngineDisplay>
	<EnginePage>
		<Gauge>
			<Type>Circular</Type>
			<Style>
				<SizePercent>90</SizePercent>
			</Style>
			<ID>Piston_LoadGauge</ID>
			<Title>%</Title>
			<Unit>Load</Unit>
			<Minimum>0</Minimum>
			<Maximum>100</Maximum>
			<Value>
				<Max>
					<Min>
						<Multiply>
							<Divide>
								<Multiply>
									<Simvar name="ENG TORQUE:1" unit="Foot pounds"/>
									<Divide>
										<Simvar name="GENERAL ENG RPM:1" unit="rpm"/>
										<Constant>5252</Constant>
									</Divide>
									<Constant>550</Constant>
								</Multiply>
								<Divide>
									<Gamevar name="AIRCRAFT MAX RATED HP" unit="ft lb per second"/>
									<Simvar name="NUMBER OF ENGINES" unit="number"/>
								</Divide>
							</Divide>
							<Constant>100</Constant>
						</Multiply>
						<Constant>100</Constant>
					</Min>
					<Constant>0</Constant>
				</Max>
			</Value>
			<ColorZone>
				<Color>green</Color>
				<Begin>0</Begin>
				<End>92</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>92</Begin>
				<End>100</End>
			</ColorZone>
		</Gauge>

		<Gauge>
			<Type>Circular</Type>
			<Style>
				<SizePercent>90</SizePercent>
			</Style>
			<ID>Piston_RPMGauge</ID>
			<Title></Title>
			<Unit>RPM</Unit>
			<Minimum>0</Minimum>
			<Maximum>2800</Maximum>
			<Style>
				<TextIncrement>10</TextIncrement>
			</Style>
			<Value>
				<Simvar name="PROP RPM:1" unit="rpm"/>
			</Value>
			<ColorZone>
				<Color>white</Color>
				<Begin>0</Begin>
				<End>2800</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>0</Begin>
				<End>2100</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>2100</Begin>
				<End>2300</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>2300</Begin>
				<End>2800</End>
			</ColorZone>
			<RedBlink>
				<Greater>
					<Simvar name="PROP RPM:1" unit="rpm"/>
					<Constant>2300</Constant>
				</Greater>
			</RedBlink>
		</Gauge>

		<Gauge>
			<Type>Horizontal</Type>
			<Style>
				<Margins>
					<Top>20</Top>
				</Margins>
			</Style>
			<ID>FFlow</ID>
			<Title>Fuel Flow</Title>
			<Unit>GPH</Unit>
			<Minimum>0</Minimum>
			<Maximum>25</Maximum>
			<GraduationLength>2.5</GraduationLength>
			<Value>
				<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
			</Value>
			<ColorZone>
				<Color>green</Color>
				<Begin>1</Begin>
				<End>20</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>20</Begin>
				<End>25</End>
			</ColorZone>
		</Gauge>

		<Gauge>
			<Type>Horizontal</Type>
			<ID>FPress</ID>
			<Title>Fuel Press</Title>
			<Minimum>0</Minimum>
			<Maximum>25</Maximum>
			<BeginText/>
			<EndText/>
			<Value>
				<Simvar name="GENERAL ENG FUEL PRESSURE:1" unit="psi"/>
			</Value>
			<ColorZone>
				<Color>red</Color>
				<Begin>0</Begin>
				<End>7</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>7</Begin>
				<End>20</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>20</Begin>
				<End>25</End>
			</ColorZone>
		</Gauge>

		<Gauge>
			<Type>Horizontal</Type>
			<ID>CHT</ID>
			<Title>CHT</Title>
			<Minimum>100</Minimum>
			<Maximum>500</Maximum>
			<BeginText/>
			<EndText/>
			<Value>
				<Simvar name="ENG CYLINDER HEAD TEMPERATURE:1" unit="farenheit"/>
			</Value>
			<ColorZone>
				<Color>green</Color>
				<Begin>150</Begin>
				<End>450</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>450</Begin>
				<End>475</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>475</Begin>
				<End>500</End>
			</ColorZone>
		</Gauge>

		<Gauge>
			<Type>Horizontal</Type>
			<ID>Piston_OilTempGauge</ID>
			<Title>Oil Temp</Title>
			<Unit></Unit>
			<Minimum>-35</Minimum>
			<Maximum>145</Maximum>
			<Value>
				<Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="celsius"/>
			</Value>
			<ColorZone>
				<Color>red</Color>
				<Begin>-35</Begin>
				<End>-30</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>-30</Begin>
				<End>50</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>50</Begin>
				<End>135</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>135</Begin>
				<End>140</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>140</Begin>
				<End>145</End>
			</ColorZone>
			<BeginText></BeginText>
			<EndText></EndText>
			<RedBlink>
				<Or>
					<Greater>
						<Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="celsius"/>
						<Constant>140</Constant>
					</Greater>
					<Lower>
						<Simvar name="GENERAL ENG OIL TEMPERATURE:1" unit="celsius"/>
						<Constant>-30</Constant>
					</Lower>
				</Or>
			</RedBlink>
		</Gauge>

		<Gauge>
			<Type>Horizontal</Type>
			<ID>Piston_OilPressGauge</ID>
			<Title>Oil Press</Title>
			<Unit></Unit>
			<Minimum>0</Minimum>
			<Maximum>7</Maximum>
			<Value>
				<Simvar name="GENERAL ENG OIL PRESSURE:1" unit="bar"/>
			</Value>
			<ColorZone>
				<Color>red</Color>
				<Begin>0</Begin>
				<End>0.9</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>0.9</Begin>
				<End>2.5</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>2.5</Begin>
				<End>6.0</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>6.0</Begin>
				<End>6.5</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>6.5</Begin>
				<End>7.0</End>
			</ColorZone>
			<BeginText></BeginText>
			<EndText></EndText>
			<RedBlink>
				<Or>
					<Greater>
						<Simvar name="GENERAL ENG OIL PRESSURE:1" unit="bar"/>
						<Constant>6.5</Constant>
					</Greater>
					<Lower>
						<Simvar name="GENERAL ENG OIL PRESSURE:1" unit="bar"/>
						<Constant>0.9</Constant>
					</Lower>
				</Or>
			</RedBlink>
		</Gauge>

		<Text>
			<Style>
				<Margins>
					<Top>10</Top>
				</Margins>
			</Style>
			<Left>Amps</Left>
			<Right id="Piston_AmpsGauge">
				<ToFixed precision="1">
					<Simvar name="ELECTRICAL MAIN BUS AMPS" unit="amperes"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>Volts</Left>
			<Right id="Piston_VoltsGauge">
				<ToFixed precision="1">
					<Simvar name="ELECTRICAL MAIN BUS VOLTAGE" unit="volts"/>
				</ToFixed>
			</Right>
		</Text>

		<Gauge>
			<Type>DoubleHorizontal</Type>
			<ID>Piston_FuelGauge</ID>
			<Title>Fuel Qty</Title>
			<Unit>Gal</Unit>
			<CursorText>R</CursorText>
			<CursorText2>L</CursorText2>
			<Minimum>0</Minimum>
			<Maximum>15</Maximum>
			<Value>
				<Simvar name="FUEL RIGHT QUANTITY" unit="gallons"/>
			</Value>
			<Value2>
				<Simvar name="FUEL LEFT QUANTITY" unit="gallons"/>
			</Value2>
			<ColorZone>
				<Color>red</Color>
				<Begin>0</Begin>
				<End>1</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>1</Begin>
				<End>15</End>
			</ColorZone>
			<GraduationLength text="True">5</GraduationLength>
		</Gauge>
	</EnginePage>

	<SystemPage>
		<Gauge>
			<Type>Circular</Type>
			<Style>
				<SizePercent>90</SizePercent>
			</Style>
			<ID>Piston_LoadGauge</ID>
			<Title>%</Title>
			<Unit>Load</Unit>
			<Minimum>0</Minimum>
			<Maximum>100</Maximum>
			<Value>
				<Max>
					<Min>
						<Multiply>
							<Divide>
								<Multiply>
									<Simvar name="ENG TORQUE:1" unit="Foot pounds"/>
									<Divide>
										<Simvar name="GENERAL ENG RPM:1" unit="rpm"/>
										<Constant>5252</Constant>
									</Divide>
									<Constant>550</Constant>
								</Multiply>
								<Divide>
									<Gamevar name="AIRCRAFT MAX RATED HP" unit="ft lb per second"/>
									<Simvar name="NUMBER OF ENGINES" unit="number"/>
								</Divide>
							</Divide>
							<Constant>100</Constant>
						</Multiply>
						<Constant>100</Constant>
					</Min>
					<Constant>0</Constant>
				</Max>
			</Value>
			<ColorZone>
				<Color>green</Color>
				<Begin>0</Begin>
				<End>92</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>92</Begin>
				<End>100</End>
			</ColorZone>
		</Gauge>

		<Gauge>
			<Type>Circular</Type>
			<Style>
				<SizePercent>90</SizePercent>
			</Style>
			<ID>Piston_RPMGauge</ID>
			<Title></Title>
			<Unit>RPM</Unit>
			<Minimum>0</Minimum>
			<Maximum>2800</Maximum>
			<Style>
				<TextIncrement>10</TextIncrement>
			</Style>
			<Value>
				<Simvar name="PROP RPM:1" unit="rpm"/>
			</Value>
			<ColorZone>
				<Color>white</Color>
				<Begin>0</Begin>
				<End>2800</End>
			</ColorZone>
			<ColorZone>
				<Color>green</Color>
				<Begin>0</Begin>
				<End>2100</End>
			</ColorZone>
			<ColorZone>
				<Color>yellow</Color>
				<Begin>2100</Begin>
				<End>2300</End>
			</ColorZone>
			<ColorZone>
				<Color>red</Color>
				<Begin>2300</Begin>
				<End>2800</End>
			</ColorZone>
			<RedBlink>
				<Greater>
					<Simvar name="PROP RPM:1" unit="rpm"/>
					<Constant>2300</Constant>
				</Greater>
			</RedBlink>
		</Gauge>

		<Gauge>
			<Type>Cylinder</Type>
			<ID>EGT_Gauge</ID>
			<Title>EGT</Title>
			<Unit>°F</Unit>
			<Rows>13</Rows>
			<Columns>4</Columns>
			<Minimum>800</Minimum>
			<Maximum>1300</Maximum>
			<TempOrder>1,3,2,4</TempOrder>
			<Value>
				<Simvar name="GENERAL ENG EXHAUST GAS TEMPERATURE:1" unit="farenheit"/>
			</Value>
			<Style>
				<ShowPeak>True</ShowPeak>
				<TextIncrement>5</TextIncrement>
			</Style>
		</Gauge>

		<Gauge>
			<Type>Cylinder</Type>
			<ID>CHT_Gauge</ID>
			<Title>CHT</Title>
			<Unit>°F</Unit>
			<Rows>13</Rows>
			<Columns>4</Columns>
			<Minimum>100</Minimum>
			<Maximum>500</Maximum>
			<TempOrder>1,3,2,4</TempOrder>
			<Value>
				<Simvar name="ENG CYLINDER HEAD TEMPERATURE:1" unit="farenheit"/>
			</Value>
			<Style>
				<ShowRedline>True</ShowRedline>
				<TextIncrement>5</TextIncrement>
			</Style>
		</Gauge>

		<Text>
			<Left>FFlow GPH</Left>
			<Right>
				<ToFixed precision="1">
					<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>Gal Rem</Left>
			<Right>
				<ToFixed precision="1">
					<Simvar name="L:WT1000_Fuel_GalRemaining" unit="gallon"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>Gal Used</Left>
			<Right>
				<ToFixed precision="1">
					<Simvar name="L:WT1000_Fuel_GalBurned" unit="gallon"/>
				</ToFixed>
			</Right>
		</Text>

		<Text>
			<Left>Endur</Left>
			<Right>
				<If>
					<Condition>
						<Greater>
							<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
							<Constant>0.1</Constant>
						</Greater>
					</Condition>
					<Then>
						<Add>
							<ToFixed precision="2">
								<Divide>
									<Simvar name="L:WT1000_Fuel_GalRemaining" unit="gallon"/>
									<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
								</Divide>
							</ToFixed>
							<Constant>h</Constant>
						</Add>
					</Then>
					<Else>
						<Constant>X</Constant>
					</Else>
				</If>
			</Right>
		</Text>

		<Text>
			<Left>Range NM</Left>
			<Right>
				<If>
					<Condition>
						<Greater>
							<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
							<Constant>0.1</Constant>
						</Greater>
					</Condition>
					<Then>
						<ToFixed precision="0">
							<Multiply>
								<Simvar name="GROUND VELOCITY:1" unit="knots"/>
								<Divide>
									<Simvar name="L:WT1000_Fuel_GalRemaining" unit="gallon"/>
									<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
								</Divide>
							</Multiply>
						</ToFixed>
					</Then>
					<Else>
						<Constant>X</Constant>
					</Else>
				</If>
			</Right>
		</Text>
	</SystemPage>
</EngineDisplay>
`;